import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ProductService } from '../product/product.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { MeetingProposalDto } from './dto/meeting-proposal.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';

const ACTIVE_TRANSACTION_MESSAGE = 'El producto ya tiene una transaccion activa';

const AGREEMENT_NEEDS_OTHER_PARTY =
  'El punto se acuerda cuando la otra persona acepta la propuesta de encuentro';

const BUYER_PROPOSES_FIRST_MESSAGE =
  'El comprador propone primero el punto y el horario; el vendedor responde';

const PROPOSAL_CHANGED_MESSAGE =
  'La propuesta de encuentro cambio; revisa la nueva antes de aceptar';

const ACTIVE_TRANSACTION_STATUSES = [
  TransactionStatus.PENDING,
  TransactionStatus.AGREED_POINT,
];

const ALLOWED_STATUS_TRANSITIONS: Record<
  TransactionStatus,
  TransactionStatus[]
> = {
  // PENDING → AGREED_POINT no se pide por aquí: ocurre al aceptar la
  // propuesta de encuentro (acceptMeeting), para que decidan los dos.
  [TransactionStatus.PENDING]: [TransactionStatus.CANCELLED],
  [TransactionStatus.AGREED_POINT]: [
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
  ],
  [TransactionStatus.COMPLETED]: [],
  [TransactionStatus.CANCELLED]: [],
};

/** Estado del producto según el resultado de la transacción (HU-17). */
const PRODUCT_STATUS_AFTER: Partial<Record<TransactionStatus, ProductStatus>> =
  {
    [TransactionStatus.COMPLETED]: ProductStatus.SOLD,
    [TransactionStatus.CANCELLED]: ProductStatus.AVAILABLE,
  };

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly productService: ProductService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  /**
   * HU-15 · Iniciar una transacción (reserva el producto).
   *
   * Todo ocurre en una transacción de base de datos con la fila del producto
   * bloqueada (SELECT ... FOR UPDATE): si varios compradores piden el mismo
   * producto a la vez, se atienden de a uno y solo el primero lo reserva; los
   * demás reciben 409. El índice único parcial UQ_transaction_active_product
   * respalda la regla «una sola transacción activa por producto».
   */
  async create(
    buyerId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const { productId } = createTransactionDto;

    let saved: Transaction;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        const product = await manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(`Product with id ${productId} not found`);
        }
        if (product.sellerId === buyerId) {
          throw new ForbiddenException(
            'No puedes iniciar una transaccion sobre tu propio producto',
          );
        }
        if (product.status !== ProductStatus.AVAILABLE) {
          throw new ConflictException(
            `El producto no esta disponible: ${product.status}`,
          );
        }

        const active = await manager.findOne(Transaction, {
          where: { productId, status: In(ACTIVE_TRANSACTION_STATUSES) },
        });
        if (active) throw new ConflictException(ACTIVE_TRANSACTION_MESSAGE);

        const transaction = await manager.save(
          manager.create(Transaction, {
            productId,
            buyerId,
            sellerId: product.sellerId,
            status: TransactionStatus.PENDING,
            message: createTransactionDto.message ?? null,
          }),
        );
        await this.productService.updateStatus(
          productId,
          ProductStatus.RESERVED,
          manager,
        );
        transaction.product = { ...product, status: ProductStatus.RESERVED };
        return transaction;
      });
    } catch (error) {
      // Violación del índice único: otra transacción activa ganó la carrera.
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException(ACTIVE_TRANSACTION_MESSAGE);
      }
      throw error;
    }

    await this.productService.invalidateFeedCache(saved.product.neighborhoodId);
    return TransactionDto.fromEntity(saved);
  }

  async findAll(userId: string): Promise<TransactionDto[]> {
    const transactions = await this.transactionRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: {
        product: true,
        buyer: true,
        seller: true,
      },
      order: { updatedAt: 'DESC' },
    });
    return transactions.map((transaction) =>
      TransactionDto.fromEntity(transaction),
    );
  }

  async findOne(id: string, userId: string): Promise<TransactionDto> {
    const transaction = await this.findEntity(id);
    this.assertParticipant(transaction, userId);
    return TransactionDto.fromEntity(transaction);
  }

  /**
   * HU-17 · Finalizar o cancelar el intercambio.
   *
   * - Solo comprador o vendedor pueden cambiar el estado (403 para cualquier
   *   otra persona, también administradores).
   * - COMPLETED deja el producto en SOLD; CANCELLED libera el producto
   *   reservado (vuelve a AVAILABLE).
   * - Transacción y producto se actualizan en una sola transacción de base de
   *   datos y con las filas bloqueadas: o cambian los dos o ninguno, y dos
   *   peticiones simultáneas no pueden pisarse.
   * - Pedir el estado que ya tiene no hace nada (no vuelve a tocar el
   *   producto): repetir «cancelar» no libera un producto que otra persona
   *   haya reservado después.
   */
  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const target = updateTransactionDto.status;

    const changedProductId = await this.dataSource.transaction(
      async (manager) => {
        // Bloqueo sin relaciones: Postgres no permite FOR UPDATE sobre un LEFT JOIN.
        const transaction = await manager.findOne(Transaction, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!transaction) {
          throw new NotFoundException(`Transaction with id ${id} not found`);
        }
        this.assertParticipant(transaction, userId);

        if (transaction.status === target) return null;
        if (target === TransactionStatus.AGREED_POINT) {
          throw new ConflictException(AGREEMENT_NEEDS_OTHER_PARTY);
        }
        this.assertTransition(transaction.status, target);

        transaction.status = target;
        await manager.save(transaction);

        const productStatus = PRODUCT_STATUS_AFTER[target];
        if (productStatus) {
          await this.productService.updateStatus(
            transaction.productId,
            productStatus,
            manager,
          );
        }
        return transaction.productId;
      },
    );

    // Se recarga después del commit para devolver el estado real del producto.
    const updated = await this.findEntity(id);
    if (changedProductId && updated.product) {
      await this.productService.invalidateFeedCache(
        updated.product.neighborhoodId,
      );
    }
    return TransactionDto.fromEntity(updated);
  }

  /**
   * HU-16 · Proponer (o contraproponer) punto seguro y horario.
   *
   * - Solo comprador o vendedor (403 para cualquier otra persona).
   * - La transacción debe estar PENDING (409 si ya hay acuerdo o se cerró).
   * - El horario debe ser futuro (400 si ya pasó).
   * - El comprador propone primero. El vendedor responde: acepta, rechaza o,
   *   si ya hay una propuesta, contrapropone (409 si intenta abrir la
   *   negociación sin propuesta del comprador).
   * - La transacción sigue en PENDING: queda registrada la propuesta y quién
   *   la hizo, y la otra persona debe aceptarla. Una nueva propuesta reemplaza
   *   a la anterior (contrapropuesta).
   * - Fila bloqueada: si la otra persona acepta o cancela al mismo tiempo, las
   *   operaciones se atienden de a una.
   */
  async proposeMeeting(
    id: string,
    userId: string,
    proposal: MeetingProposalDto,
  ): Promise<TransactionDto> {
    const scheduledTime = this.parseFutureTime(proposal.scheduledTime);

    await this.dataSource.transaction(async (manager) => {
      const transaction = await this.lockForMeeting(manager, id, userId);
      if (userId === transaction.sellerId && !transaction.proposedById) {
        throw new ConflictException(BUYER_PROPOSES_FIRST_MESSAGE);
      }
      transaction.safePointId = proposal.safePointId;
      transaction.scheduledTime = scheduledTime;
      transaction.proposedById = userId;
      transaction.agreedAt = null;
      await manager.save(transaction);
    });

    return TransactionDto.fromEntity(await this.findEntity(id));
  }

  /**
   * HU-16 · Aceptar la propuesta de la otra persona: queda el acuerdo.
   *
   * - Solo la contraparte de quien propuso (409 si es tu propia propuesta).
   * - Se envía la propuesta que se vio; si cambió mientras tanto (hubo una
   *   contrapropuesta), 409 en lugar de aceptar algo distinto.
   * - El horario aún debe ser futuro.
   * - La transacción pasa a AGREED_POINT.
   */
  async acceptMeeting(
    id: string,
    userId: string,
    seen: MeetingProposalDto,
  ): Promise<TransactionDto> {
    const seenTime = new Date(seen.scheduledTime);
    if (Number.isNaN(seenTime.getTime())) {
      throw new BadRequestException(
        'scheduledTime debe ser una fecha ISO valida',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const transaction = await this.lockForMeeting(manager, id, userId);
      this.assertCounterpartOfProposal(transaction, userId);

      if (
        transaction.safePointId !== seen.safePointId ||
        transaction.scheduledTime?.getTime() !== seenTime.getTime()
      ) {
        throw new ConflictException(PROPOSAL_CHANGED_MESSAGE);
      }
      if (seenTime.getTime() <= Date.now()) {
        throw new BadRequestException(
          'El horario propuesto ya paso; propon uno nuevo',
        );
      }

      transaction.status = TransactionStatus.AGREED_POINT;
      transaction.agreedAt = new Date();
      await manager.save(transaction);
    });

    return TransactionDto.fromEntity(await this.findEntity(id));
  }

  /**
   * HU-16 · Rechazar la propuesta de la otra persona.
   *
   * Se borra la propuesta y la transacción sigue en PENDING: cualquiera de los
   * dos puede proponer otro punto u horario.
   */
  async rejectMeeting(id: string, userId: string): Promise<TransactionDto> {
    await this.dataSource.transaction(async (manager) => {
      const transaction = await this.lockForMeeting(manager, id, userId);
      this.assertCounterpartOfProposal(transaction, userId);

      transaction.safePointId = null;
      transaction.scheduledTime = null;
      transaction.proposedById = null;
      await manager.save(transaction);
    });

    return TransactionDto.fromEntity(await this.findEntity(id));
  }

  /** Bloquea la transacción y valida participante y estado PENDING. */
  private async lockForMeeting(
    manager: EntityManager,
    id: string,
    userId: string,
  ): Promise<Transaction> {
    // Bloqueo sin relaciones: Postgres no permite FOR UPDATE sobre un LEFT JOIN.
    const transaction = await manager.findOne(Transaction, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    this.assertParticipant(transaction, userId);
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ConflictException(
        'Solo transacciones PENDING pueden negociar el punto de encuentro',
      );
    }
    return transaction;
  }

  private assertCounterpartOfProposal(
    transaction: Transaction,
    userId: string,
  ): void {
    if (
      !transaction.proposedById ||
      !transaction.safePointId ||
      !transaction.scheduledTime
    ) {
      throw new ConflictException('No hay una propuesta de encuentro vigente');
    }
    if (transaction.proposedById === userId) {
      throw new ConflictException(
        'Tu propuesta debe aceptarla o rechazarla la otra persona',
      );
    }
  }

  private parseFutureTime(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'scheduledTime debe ser una fecha ISO valida',
      );
    }
    if (date.getTime() <= Date.now()) {
      throw new BadRequestException(
        'scheduledTime debe ser una fecha y hora futura',
      );
    }
    return date;
  }

  private async findEntity(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: {
        product: true,
        buyer: true,
        seller: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return transaction;
  }

  private assertParticipant(transaction: Transaction, userId: string): void {
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'Solo los participantes pueden ver o modificar esta transaccion',
      );
    }
  }

  private assertTransition(
    from: TransactionStatus,
    to: TransactionStatus,
  ): void {
    if (from === to) return;
    if (!ALLOWED_STATUS_TRANSITIONS[from].includes(to)) {
      throw new ConflictException(
        `Transicion de estado invalida: ${from} -> ${to}`,
      );
    }
  }
}

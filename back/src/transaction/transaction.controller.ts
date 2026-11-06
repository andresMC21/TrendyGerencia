import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { MeetingProposalDto } from './dto/meeting-proposal.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Iniciar una intención de compra o trueque',
    description:
      'Requiere JWT. El usuario autenticado queda como comprador; el vendedor se obtiene del producto. La transacción inicia en PENDING y el producto queda reservado.',
  })
  @ApiBody({
    type: CreateTransactionDto,
    description:
      'Identificador del producto y mensaje opcional para el vendedor.',
  })
  @ApiCreatedResponse({
    type: TransactionDto,
    description:
      'La intención se creó en estado PENDING y el producto quedó reservado.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no es válido, productId no tiene formato UUID o message supera 500 caracteres.',
  })
  @ApiNotFoundResponse({
    description: 'No existe el producto indicado.',
  })
  @ApiConflictResponse({
    description:
      'El producto no está disponible o ya tiene una transacción activa.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado intenta comprar su propio producto.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al crear la transacción.',
  })
  create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.create(user.id, createTransactionDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar las transacciones del usuario autenticado',
    description:
      'Requiere JWT. Incluye las transacciones en las que participa como comprador o vendedor, ordenadas por última actualización.',
  })
  @ApiOkResponse({
    type: [TransactionDto],
    description:
      'Lista las transacciones en las que participa el usuario autenticado; puede estar vacía.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar las transacciones.',
  })
  findAll(@GetUser() user: User): Promise<TransactionDto[]> {
    return this.transactionService.findAll(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Consultar una transacción',
    description: 'Requiere JWT. Solo pueden consultarla sus participantes.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'Se devuelve la transacción y sus datos relacionados.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la transacción no tiene formato UUID.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al consultar la transacción.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<TransactionDto> {
    return this.transactionService.findOne(id, user.id);
  }

  @Put(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Finalizar o cancelar la transacción (HU-17)',
    description:
      'Solo el comprador o el vendedor pueden cambiar el estado. Transiciones válidas: PENDING → CANCELLED y AGREED_POINT → COMPLETED/CANCELLED. ' +
      'COMPLETED deja el producto en SOLD y CANCELLED lo libera (vuelve a AVAILABLE); transacción y producto se guardan juntos. ' +
      'AGREED_POINT no se pide aquí: se alcanza cuando la otra persona acepta la propuesta de encuentro (HU-16). Pedir el estado que la transacción ya tiene no cambia nada.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiBody({
    type: UpdateTransactionDto,
    description: 'Nuevo estado solicitado para la transacción.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'La transacción se actualizó al estado solicitado.',
  })
  @ApiBadRequestResponse({
    description:
      'El identificador o el estado no son válidos.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario autenticado no es el comprador ni el vendedor de la transacción.',
  })
  @ApiConflictResponse({
    description:
      'La transición no está permitida desde el estado actual (por ejemplo, cancelar una transacción ya completada, completar una que aún no acordó punto o pedir AGREED_POINT sin que la otra persona acepte).',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al actualizar la transacción.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.update(id, user.id, updateTransactionDto);
  }

  @Post(':id/meeting-proposal')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Proponer o contraproponer punto seguro y horario (HU-16)',
    description:
      'Requiere JWT y participación en la transacción, que debe estar PENDING. Guarda la propuesta y quién la hizo; la transacción sigue en PENDING hasta que la otra persona la acepte. Una nueva propuesta de cualquiera de los dos reemplaza a la anterior.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiBody({
    type: MeetingProposalDto,
    description: 'Punto seguro y fecha/hora futura propuestos para el encuentro.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description:
      'La propuesta quedó registrada y espera la respuesta de la otra persona.',
  })
  @ApiBadRequestResponse({
    description:
      'El identificador, el punto seguro o la fecha no son válidos, o la fecha ya pasó.',
  })
  @ApiConflictResponse({
    description: 'La transacción no está en estado PENDING.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al negociar el punto de encuentro.',
  })
  proposeMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() proposal: MeetingProposalDto,
  ): Promise<TransactionDto> {
    return this.transactionService.proposeMeeting(id, user.id, proposal);
  }

  @Post(':id/meeting-proposal/accept')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Aceptar la propuesta de encuentro de la otra persona (HU-16)',
    description:
      'Solo la contraparte de quien propuso puede aceptar. Se envía la propuesta que se vio: si cambió mientras tanto, responde 409. Al aceptar, la transacción pasa a AGREED_POINT.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiBody({
    type: MeetingProposalDto,
    description: 'La propuesta que se está aceptando (punto y horario).',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'Comprador y vendedor quedaron de acuerdo: AGREED_POINT.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no es válido o el horario propuesto ya pasó (hay que proponer otro).',
  })
  @ApiConflictResponse({
    description:
      'No hay propuesta vigente, es tu propia propuesta, la propuesta cambió o la transacción no está PENDING.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al negociar el punto de encuentro.',
  })
  acceptMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() seen: MeetingProposalDto,
  ): Promise<TransactionDto> {
    return this.transactionService.acceptMeeting(id, user.id, seen);
  }

  @Post(':id/meeting-proposal/reject')
  @Auth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rechazar la propuesta de encuentro de la otra persona (HU-16)',
    description:
      'Solo la contraparte de quien propuso puede rechazar. La propuesta se borra y la transacción sigue en PENDING para que cualquiera proponga otra.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '00000000-0000-4000-8000-000000000000',
    description: 'Identificador UUID de la transacción.',
  })
  @ApiOkResponse({
    type: TransactionDto,
    description: 'La propuesta se rechazó; la transacción sigue en PENDING.',
  })
  @ApiBadRequestResponse({
    description: 'El identificador de la transacción no tiene formato UUID.',
  })
  @ApiConflictResponse({
    description:
      'No hay propuesta vigente, es tu propia propuesta o la transacción no está PENDING.',
  })
  @ApiNotFoundResponse({
    description: 'No existe una transacción con ese identificador.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario autenticado no participa en la transacción.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error inesperado al negociar el punto de encuentro.',
  })
  rejectMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<TransactionDto> {
    return this.transactionService.rejectMeeting(id, user.id);
  }
}

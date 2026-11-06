import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

describe('TransactionController', () => {
  let controller: TransactionController;
  const transactionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    proposeMeeting: jest.fn(),
    acceptMeeting: jest.fn(),
    rejectMeeting: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [TransactionController],
      providers: [
        { provide: TransactionService, useValue: transactionService },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    // Assert
    expect(controller).toBeDefined();
  });

  it('create usa el id del usuario autenticado', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    const dto = { productId: 'p1' };
    transactionService.create.mockResolvedValue('created');

    // Act
    const result = await controller.create(user, dto);

    // Assert
    expect(result).toBe('created');
    expect(transactionService.create).toHaveBeenCalledWith('buyer-1', dto);
  });

  it('findAll lista transacciones del usuario autenticado', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    transactionService.findAll.mockResolvedValue(['t1']);

    // Act
    const result = await controller.findAll(user);

    // Assert
    expect(result).toEqual(['t1']);
    expect(transactionService.findAll).toHaveBeenCalledWith('buyer-1');
  });

  it('findOne delega id y usuario autenticado', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    transactionService.findOne.mockResolvedValue('detail');

    // Act
    const result = await controller.findOne('t1', user);

    // Assert
    expect(result).toBe('detail');
    expect(transactionService.findOne).toHaveBeenCalledWith('t1', 'buyer-1');
  });

  it('updateStatus delega id, usuario y estado', async () => {
    // Arrange
    const user = { id: 'seller-1' } as any;
    const dto = { status: TransactionStatus.COMPLETED };
    transactionService.update.mockResolvedValue('updated');

    // Act
    const result = await controller.updateStatus('t1', user, dto);

    // Assert
    expect(result).toBe('updated');
    expect(transactionService.update).toHaveBeenCalledWith(
      't1',
      'seller-1',
      dto,
    );
  });

  it('proposeMeeting delega id, usuario y propuesta', async () => {
    // Arrange
    const user = { id: 'buyer-1' } as any;
    const dto = { safePointId: 'sp-1', scheduledTime: '2026-10-05T15:00:00Z' };
    transactionService.proposeMeeting.mockResolvedValue('proposed');

    // Act
    const result = await controller.proposeMeeting('t1', user, dto);

    // Assert
    expect(result).toBe('proposed');
    expect(transactionService.proposeMeeting).toHaveBeenCalledWith('t1', 'buyer-1', dto);
  });

  it('acceptMeeting delega id, usuario y la propuesta vista', async () => {
    // Arrange
    const user = { id: 'seller-1' } as any;
    const dto = { safePointId: 'sp-1', scheduledTime: '2026-10-05T15:00:00Z' };
    transactionService.acceptMeeting.mockResolvedValue('accepted');

    // Act
    const result = await controller.acceptMeeting('t1', user, dto);

    // Assert
    expect(result).toBe('accepted');
    expect(transactionService.acceptMeeting).toHaveBeenCalledWith('t1', 'seller-1', dto);
  });

  it('rejectMeeting delega id y usuario', async () => {
    // Arrange
    const user = { id: 'seller-1' } as any;
    transactionService.rejectMeeting.mockResolvedValue('rejected');

    // Act
    const result = await controller.rejectMeeting('t1', user);

    // Assert
    expect(result).toBe('rejected');
    expect(transactionService.rejectMeeting).toHaveBeenCalledWith('t1', 'seller-1');
  });
});

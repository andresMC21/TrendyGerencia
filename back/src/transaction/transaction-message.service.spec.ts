import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionMessage } from './entities/transaction-message.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionMessageService } from './transaction-message.service';

/** TRD-25 · Chat de la transacción. */
describe('TransactionMessageService', () => {
  let service: TransactionMessageService;
  const txRepo = { findOne: jest.fn() };
  const msgRepo = { find: jest.fn(), create: jest.fn((x) => x), save: jest.fn() };
  const tx = (status = TransactionStatus.PENDING) => ({ id: 't1', buyerId: 'buyer', sellerId: 'seller', status });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TransactionMessageService,
        { provide: getRepositoryToken(Transaction), useValue: txRepo },
        { provide: getRepositoryToken(TransactionMessage), useValue: msgRepo },
      ],
    }).compile();
    service = module.get(TransactionMessageService);
  });

  it('lista los mensajes en orden para un participante', async () => {
    // Arrange
    const createdAt = new Date('2026-11-25T10:00:00Z');
    txRepo.findOne.mockResolvedValue(tx());
    msgRepo.find.mockResolvedValue([{ id: 'm1', transactionId: 't1', senderId: 'seller', body: 'Hola', createdAt, sender: { password: 'x' } }]);

    // Act
    const res = await service.list('t1', 'buyer');

    // Assert
    expect(msgRepo.find).toHaveBeenCalledWith({ where: { transactionId: 't1' }, order: { createdAt: 'ASC' }, take: 500 });
    expect(res).toEqual([{ id: 'm1', transactionId: 't1', senderId: 'seller', body: 'Hola', createdAt }]);
  });

  it('guarda el mensaje con quien lo envía', async () => {
    // Arrange
    txRepo.findOne.mockResolvedValue(tx());
    msgRepo.save.mockImplementation(async (m) => ({ id: 'm2', createdAt: new Date(), ...m }));

    // Act
    const res = await service.send('t1', 'seller', { body: '¿El jueves?' });

    // Assert
    expect(msgRepo.create).toHaveBeenCalledWith({ transactionId: 't1', senderId: 'seller', body: '¿El jueves?' });
    expect(res).toMatchObject({ id: 'm2', senderId: 'seller', body: '¿El jueves?' });
  });

  it('404 si la transacción no existe', async () => {
    txRepo.findOne.mockResolvedValue(null);
    await expect(service.list('t1', 'buyer')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403 si quien pide no participa', async () => {
    txRepo.findOne.mockResolvedValue(tx());
    await expect(service.list('t1', 'otro')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.send('t1', 'otro', { body: 'hola' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });

  it('409 al escribir en una transacción cancelada', async () => {
    txRepo.findOne.mockResolvedValue(tx(TransactionStatus.CANCELLED));
    await expect(service.send('t1', 'buyer', { body: 'hola' })).rejects.toBeInstanceOf(ConflictException);
    expect(msgRepo.save).not.toHaveBeenCalled();
  });
});

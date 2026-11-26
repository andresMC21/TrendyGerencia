import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { CreateTransactionMessageDto, TransactionMessageDto } from './dto/transaction-message.dto';
import { TransactionMessageService } from './transaction-message.service';

@ApiTags('Transactions')
@Controller('transactions/:id/messages')
export class TransactionMessageController {
  constructor(private readonly messageService: TransactionMessageService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Mensajes del chat de una transacción', description: 'TRD-25 · Solo comprador y vendedor; del más antiguo al más reciente.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionMessageDto, isArray: true })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la transacción.' })
  @ApiNotFoundResponse({ description: 'No existe la transacción.' })
  list(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<TransactionMessageDto[]> {
    return this.messageService.list(id, user.id);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Enviar un mensaje al chat de una transacción', description: 'TRD-25 · Solo comprador y vendedor; no se puede escribir en una transacción cancelada.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: CreateTransactionMessageDto })
  @ApiCreatedResponse({ type: TransactionMessageDto })
  @ApiForbiddenResponse({ description: 'El usuario no participa en la transacción.' })
  @ApiNotFoundResponse({ description: 'No existe la transacción.' })
  @ApiConflictResponse({ description: 'La transacción fue cancelada.' })
  send(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTransactionMessageDto,
  ): Promise<TransactionMessageDto> {
    return this.messageService.send(id, user.id, dto);
  }
}

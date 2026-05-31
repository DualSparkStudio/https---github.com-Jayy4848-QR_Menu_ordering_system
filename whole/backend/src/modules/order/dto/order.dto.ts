import { IsString, IsOptional, IsArray, IsNumber, IsIn, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString() menuItemId: string;
  @IsNumber() @Min(1) quantity: number;
  @IsOptional() selectedVariants?: any;
  @IsOptional() @IsString() specialInstructions?: string;
}

export class CreateOrderDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsString() guestName?: string;
  @IsOptional() @IsString() guestPhone?: string;
  @IsOptional() @IsNumber() @Min(1) guestCount?: number;
  @IsOptional() @IsString() specialInstructions?: string;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsString() couponCode?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']) status: string;
  @IsOptional() @IsString() reason?: string;
}

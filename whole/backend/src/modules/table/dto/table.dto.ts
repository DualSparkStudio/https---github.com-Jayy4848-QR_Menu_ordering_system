import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min } from 'class-validator';

export class CreateTableDto {
  @IsString() tableNumber: string;
  @IsOptional() @IsString() section?: string;
  @IsOptional() @IsNumber() @Min(1) capacity?: number;
}

export class UpdateTableDto {
  @IsOptional() @IsString() tableNumber?: string;
  @IsOptional() @IsString() section?: string;
  @IsOptional() @IsNumber() @Min(1) capacity?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsIn(['available', 'occupied', 'reserved', 'maintenance']) status?: string;
}

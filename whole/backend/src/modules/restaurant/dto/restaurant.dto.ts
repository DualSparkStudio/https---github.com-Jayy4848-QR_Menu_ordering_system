import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateRestaurantDto {
  @IsString() name: string;
  @IsString() slug: string;
  @IsOptional() @IsString() description?: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsString() country: string;
  @IsString() zipCode: string;
  @IsString() phone: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() banner?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) serviceChargePercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) cgstPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) sgstPercentage?: number;
  @IsOptional() @IsString() openingHours?: string;
}

export class UpdateRestaurantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() banner?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) serviceChargePercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) cgstPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) sgstPercentage?: number;
  @IsOptional() @IsBoolean() isOpen?: boolean;
  @IsOptional() @IsString() openingHours?: string;
}

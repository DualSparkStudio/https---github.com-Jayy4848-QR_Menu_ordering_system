import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateMenuItemDto {
  @IsString() categoryId: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsNumber() @Min(0) basePrice: number;
  @IsOptional() @IsBoolean() isVegetarian?: boolean;
  @IsOptional() @IsBoolean() isVegan?: boolean;
  @IsOptional() @IsBoolean() isGlutenFree?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(3) spiceLevel?: number;
  @IsOptional() @IsString() allergens?: string;
  @IsOptional() @IsNumber() calories?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsNumber() preparationTime?: number;
  @IsOptional() @IsNumber() displayOrder?: number;
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) basePrice?: number;
  @IsOptional() @IsBoolean() isVegetarian?: boolean;
  @IsOptional() @IsBoolean() isVegan?: boolean;
  @IsOptional() @IsBoolean() isGlutenFree?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(3) spiceLevel?: number;
  @IsOptional() @IsString() allergens?: string;
  @IsOptional() @IsNumber() calories?: number;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsNumber() preparationTime?: number;
  @IsOptional() @IsNumber() displayOrder?: number;
}

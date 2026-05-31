import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateWaiterCallDto {
  @IsIn(['waiter', 'bill', 'water', 'napkins', 'other']) type: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateWaiterCallDto {
  @IsIn(['pending', 'acknowledged', 'resolved']) status: string;
  @IsOptional() @IsString() assignedStaffId?: string;
}

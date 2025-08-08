import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApprovalStatus } from './event.types';

@InputType()
export class CreateEventInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  event_name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  location: string;

  @Field()
  @IsBoolean()
  trending: boolean;

  @Field(() => Float)
  @IsNumber()
  registration_fee: number;

  @Field(() => Date)
  @IsDateString()
  event_start_date: string;

  @Field(() => Date)
  @IsDateString()
  event_end_date: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  description: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  user_type: string;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field({ defaultValue: 'active' })
  @IsOptional()
  @IsString()
  event_type?: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  image: string;

  @Field(() => ApprovalStatus, { defaultValue: ApprovalStatus.PENDING })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approval?: ApprovalStatus;
}

@InputType()
export class UpdateEventInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  event_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  trending?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  registration_fee?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  event_start_date?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  event_end_date?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  user_type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  event_type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @Field(() => ApprovalStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approval?: ApprovalStatus;
}

@InputType()
export class EventFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  trending?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => ApprovalStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approval?: ApprovalStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  event_type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  user_type?: string;
}

@InputType()
export class RegisterUserToEventInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  event_id: number;
}


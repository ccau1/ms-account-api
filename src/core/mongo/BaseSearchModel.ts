import { IsMongoId, IsOptional, IsString, IsDate } from 'class-validator';

export class BaseSearchModel {
  @IsOptional()
  @IsMongoId()
  _ids?: string[];

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  populates?: string[];

  @IsOptional()
  @IsDate()
  dateFr?: Date;

  @IsOptional()
  @IsDate()
  dateTo?: Date;
}

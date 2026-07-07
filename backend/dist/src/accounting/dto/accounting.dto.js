"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsOfDateQueryDto = exports.DateRangeQueryDto = exports.CreateExpenseDto = exports.EXPENSE_CATEGORIES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.EXPENSE_CATEGORIES = [
    'RENT',
    'UTILITIES',
    'SALARIES',
    'MARKETING',
    'SUPPLIES',
    'OTHER',
];
class CreateExpenseDto {
    category;
    description;
    amount;
    date;
}
exports.CreateExpenseDto = CreateExpenseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.EXPENSE_CATEGORIES, example: 'RENT' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.EXPENSE_CATEGORIES),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Monthly office rent' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "date", void 0);
class DateRangeQueryDto {
    startDate;
    endDate;
}
exports.DateRangeQueryDto = DateRangeQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-07-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DateRangeQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-07-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DateRangeQueryDto.prototype, "endDate", void 0);
class AsOfDateQueryDto {
    asOfDate;
}
exports.AsOfDateQueryDto = AsOfDateQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-07-06' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AsOfDateQueryDto.prototype, "asOfDate", void 0);
//# sourceMappingURL=accounting.dto.js.map
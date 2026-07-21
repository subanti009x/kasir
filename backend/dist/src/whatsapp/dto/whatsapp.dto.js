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
exports.WhatsappLogQueryDto = exports.UpdateWhatsappConfigDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateWhatsappConfigDto {
    botName;
    enabled;
    checkoutTemplate;
    refundTemplate;
}
exports.UpdateWhatsappConfigDto = UpdateWhatsappConfigDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nusantara Bakery Bot' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWhatsappConfigDto.prototype, "botName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateWhatsappConfigDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Halo {{customer_name}}! 🧾\n\nTerima kasih telah berbelanja di *{{store_name}}*.\n\nNo. Struk: {{receipt_id}}\n{{items}}\n\n*Total: {{total}}*',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWhatsappConfigDto.prototype, "checkoutTemplate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWhatsappConfigDto.prototype, "refundTemplate", void 0);
class WhatsappLogQueryDto {
    status;
    page;
    limit;
}
exports.WhatsappLogQueryDto = WhatsappLogQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['PENDING', 'SENDING', 'SENT', 'FAILED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsappLogQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WhatsappLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WhatsappLogQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=whatsapp.dto.js.map
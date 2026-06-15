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
exports.Place = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("../categories/category.entity");
let Place = class Place {
    id;
    name;
    address;
    phone;
    opening_hours;
    lat;
    lng;
    osm_id;
    source;
    category;
};
exports.Place = Place;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Place.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Place.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Place.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Place.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Place.prototype, "opening_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Place.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Place.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Place.prototype, "osm_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'osm' }),
    __metadata("design:type", String)
], Place.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { nullable: true, eager: true }),
    __metadata("design:type", category_entity_1.Category)
], Place.prototype, "category", void 0);
exports.Place = Place = __decorate([
    (0, typeorm_1.Entity)('places')
], Place);
//# sourceMappingURL=place.entity.js.map
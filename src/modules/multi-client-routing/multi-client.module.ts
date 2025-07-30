// src/modules/multi-client-routing/multi-client-routing.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MultiClientRouting,
  MultiClientRoutingSchema,
} from 'src/schemas/multi-client.schema';
import { MultiClientRoutingService } from 'src/services/multi-client.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MultiClientRouting.name, schema: MultiClientRoutingSchema },
    ]),
  ],
  providers: [MultiClientRoutingService],
  exports: [MultiClientRoutingService],
})
export class MultiClientRoutingModule {}

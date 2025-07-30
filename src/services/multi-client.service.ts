import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MultiClientRouting } from 'src/schemas/multi-client.schema';

@Injectable()
export class MultiClientRoutingService {
  constructor(
    @InjectModel(MultiClientRouting.name)
    private readonly routingModel: Model<MultiClientRouting>,
  ) {}

  async resolveRouting(
    entity: string,
    orgId: string,
    context: Record<string, any>,
  ) {
    const routingData: any = await this.routingModel
      .find({ entity, org_id: orgId })
      .sort({ priority: -1 }) // highest priority first
      .lean();

    const rules = routingData[0]?.rules;

    console.log(rules);

    for (const rule of rules) {
      console.log(rule);
      console.log(rule.match);

      const isMatch = Object.entries(rule.match || {}).every(([key, value]) => {
        return context[key] === value;
      });

      if (isMatch) {
        return {
          connection: rule.connection,
          prefix: rule.prefix,
        };
      }
    }

    return null; // or fallback to default
  }
}

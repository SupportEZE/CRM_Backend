import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { Model } from 'mongoose';
import { CustomerLeaderBoardModel } from 'src/modules/master/customer/default/models/customer-leaderboard.model';
import { LeaderBoardModel } from '../models/leader-board.model';
import { LeaderBoardGiftsModel } from '../models/leader-board-gifts.model';
import { CustomerModel } from '../../../master/customer/default/models/customer.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';

@Injectable()
export class AppLeaderBoardService {
  constructor(
    @InjectModel(CustomerLeaderBoardModel.name)
    private customerLeaderBoardModel: Model<CustomerLeaderBoardModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(LeaderBoardModel.name)
    private leaderBoardModel: Model<LeaderBoardModel>,
    @InjectModel(LeaderBoardGiftsModel.name)
    private leaderboardgiftsModel: Model<LeaderBoardGiftsModel>,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async detail(req: any, params: any): Promise<any> {
    try {
      let match = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_id: req['user']['_id'],
      };
      const customerEntry = await this.customerLeaderBoardModel
        .findOne(match)
        .sort({ timestamp: -1 })
        .exec();

      if (customerEntry) {
        const leaderboard = await this.leaderBoardModel
          .findOne({
            _id: customerEntry.leader_board_id,
          })
          .exec();

        if (!leaderboard) {
          return this.res.error(HttpStatus.NOT_FOUND, 'LEADERBOARD.NOT_EXIST');
        }

        const currentDate = new Date();
        const leaderboardEndDate = new Date(leaderboard.end_date);

        if (leaderboardEndDate > currentDate) {
          let allParticipents = await this.customerLeaderBoardModel
            .find({
              leader_board_id: customerEntry.leader_board_id,
            })
            .sort({ customer_name: 1 })
            .lean();

          let topTenParticipents = await this.customerLeaderBoardModel
            .find({
              leader_board_id: customerEntry.leader_board_id,
              total_points : {$gte: leaderboard.min_eligiblity_points}
            })
            .sort({ total_points: -1, customer_name: 1 })
            .limit(10)
            .lean();

          for (let index = 0; index < topTenParticipents.length; index++) {
            const participant = topTenParticipents[index];
            participant.rank = index + 1;
            const profile = await this.customerModel
              .findOne({
                _id: participant.customer_id,
              })
              .exec();
            participant.profile_pic = '';
            participant.state = profile.state;
          }

          const loggedInUserRank = allParticipents.find(
            (participant) =>
              participant.customer_id.toString() ===
              req['user']['_id'].toString(),
          );

          if (loggedInUserRank) {
            const currentUserIndex = allParticipents.findIndex(
              (participant) =>
                participant.customer_id.toString() ===
                req['user']['_id'].toString(),
            );
            const nextRank = allParticipents[currentUserIndex + 1];
            let pointsNeededToNextRank = 0;
            let nextRankDetails = null;

            if (nextRank) {
              pointsNeededToNextRank =
                nextRank.total_points - loggedInUserRank.total_points;
              nextRankDetails = nextRank;
            }

            const gift_detail = await this.leaderboardgiftsModel
              .find({
                leader_board_id: customerEntry.leader_board_id,
              })
              .exec();

            topTenParticipents = await Promise.all(
              topTenParticipents.map(async (item: any) => {
                const thumbnail = await this.sharedCustomerService.getDocument(
                  item.customer_id,
                  global.THUMBNAIL_IMAGE,
                  'Profile Pic',
                );
                item.files = thumbnail;
                return item;
              }),
            );

            let notEligibleFinaldata = {
              leaderboard,
              topTenParticipents,
              gift_detail,
              loggedInUserRank,
              currentUserIndex,
              pointsNeededToNextRank,
              nextRankDetails,
            }

            if(!topTenParticipents || topTenParticipents.length < 1){
              return this.res.success('Zero Participant Found with min_eligiblity_points.',
                notEligibleFinaldata
              );
            }
            const finalData = {
              leaderboard,
              topTenParticipents,
              gift_detail,
              loggedInUserRank,
              currentUserIndex,
              pointsNeededToNextRank,
              nextRankDetails,
            };

            return this.res.success('SUCCESS.FETCH', finalData);
          } else {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'LEADERBOARD.NOT_EXIST',
            );
          }
        } else {
          return this.res.error(HttpStatus.NOT_FOUND, 'LEADERBOARD.NOT_EXIST');
        }
      } else {
        return this.res.error(HttpStatus.NOT_FOUND, 'LEADERBOARD.NOT_EXIST');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}

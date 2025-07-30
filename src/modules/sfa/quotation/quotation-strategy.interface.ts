// quotation-strategy.interface.ts

export interface QuotationStrategy {
  create?(req: Request, params: any): Promise<any>;

  read?(req: Request, params: any): Promise<any>;

  detail?(req: Request, params: any): Promise<any>;

  updateStage?(req: Request, params: any): Promise<any>;

  customerWiseQuotation?(req: Request, params: any): Promise<any>;

  addItem?(req: Request, params: any): Promise<any>;

  updateStatus?(req: Request, params: any): Promise<any>;

  delete?(req: Request, params: any): Promise<any>;

  readDashboardCount?(req: Request, params: any): Promise<any>;

  readDashboardGraph?(req: Request, params: any): Promise<any>;

  exportPdf?(req: Request, params: any): Promise<any>;

  upload?(files: Express.Multer.File[], req: any): Promise<any>;

  getDocument?(id: any, type: string): Promise<any>;

  detail_by_enquiry?(req: Request, params: any): Promise<any>;
}

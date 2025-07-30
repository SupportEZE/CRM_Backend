export interface EnquiryStrategy {
    createEnquiry?(req: Request, params: any): Promise<any>;
    getAllEnquiries?(req: Request, params: any): Promise<any>;
    updateEnquiry?(req: Request, params: any): Promise<any>;
    statusUpdate?(req: Request, params: any): Promise<any>;
    detail?(req: Request, params: any): Promise<any>;
    findByExistEnquiry?(req: Request, params: any): Promise<any>;
    enquiryDashboard?(req: Request, params: any): Promise<any>;
    saveStages?(req: Request, params: any): Promise<any>;
    saveComments?(req: Request, params: any): Promise<any>;
    readComments?(req: Request, params: any): Promise<any>;
    activities?(req: Request, params: any): Promise<any>;
    getDocument?(req: Request, params: any): Promise<any>;
    upload?(params: any, req: Request): Promise<Request>;
    fetchAssignedUsers?(params: any, req: Request): Promise<Request>;
    readUsingPincode?(params: any, req: Request): Promise<Request>;
}

export interface CommentStrategy {
    saveComment?(req: Request, params: any): Promise<any>;
    readComments?(req: Request, params: any): Promise<any>;
}

export interface PostalCodeStrategy {
    readUsingPincode?(req: Request, params: any): Promise<any>;
}
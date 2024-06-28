export interface IReview {
    _id: string
    idAccount: {
        _id: string
        userName: string
        email: string
    }
    productId: any
    content: string
    createdAt: Date
    updatedAt: Date
}

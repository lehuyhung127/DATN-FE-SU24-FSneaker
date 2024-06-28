import { IOrderStatus } from './order'

export interface IProduct {
    _id: string
    name: string
    description: string
    categoryId: string
    status: string
    createdAt: Date
    updatedAt: Date
}

export interface IAddProductBody {
    name: string
    description: string
    categoryId: string
    status: string
}

export interface IAddProductResponse {
    message: string
    datas: IProduct
}

export interface IOderHistory {
    adminId: string
    adminName: string
    status: IOrderStatus
    timeStamp: Date
}

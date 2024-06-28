import { InfoCircleOutlined } from '@ant-design/icons'
import { Button, Space, Table, TableProps } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IReview } from '@/common/interfaces/review'
import { getReviews } from '@/services/review'

const ReviewList = () => {
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(false)

    const [reviews, setReviews] = useState<IReview[]>([])

    const fetchReviews = async () => {
        setIsLoading(true)

        const response = await getReviews()
        const data = response?.data?.filter((item) => item)

        if (data) {
            setReviews(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    const navigateToDetail = (id: string) => {
        navigate(`/admin/reviews/detail/${id}`)
    }

    const columns: TableProps<IReview>['columns'] = [
        {
            title: 'ID',
            dataIndex: '_id',
            key: '_id'
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'productId',
            key: 'productName',
            render: (value: IReview['productId']) => value?.name
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: Date) => value && dayjs(value).format('HH:MM DD-MM-YYYY')
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content'
        },
        {
            title: 'Người đánh giá',
            dataIndex: 'idAccount',
            key: 'idAccount',
            render: (value: IReview['idAccount']) => value && value?.userName
        },
        {
            title: 'Email',
            dataIndex: 'idAccount',
            key: 'email',
            render: (value: IReview['idAccount']) => value && value?.email
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space size='middle'>
                    <Button
                        onClick={() => {
                            navigateToDetail(record._id)
                        }}
                    >
                        <InfoCircleOutlined style={{ display: 'inline-flex' }} />
                    </Button>
                </Space>
            )
        }
    ]

    return (
        <div className='border p-6'>
            <Table<IReview> dataSource={reviews} columns={columns} loading={isLoading} />
        </div>
    )
}

export default ReviewList

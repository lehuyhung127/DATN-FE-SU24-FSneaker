import { getReview } from '@/services/review'
import { Card, Col, ColProps, Form, Input, Row, Typography, Upload, UploadFile, UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Detail from '@/components/crud/detail'
import dayjs from 'dayjs'

interface FieldType {
    content: string
    username: string
    createdAt: string
    updatedAt: string
    name: string
    description: string
    status: string
    category: string
    thumbnail: UploadFile[]
    gallery: UploadFile[]
    sizes: any
    email: string
}

const colProps: ColProps = {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 6,
    xxl: 6
}

const uploadProps: UploadProps = {
    disabled: true,
    showUploadList: {
        showPreviewIcon: false,
        showRemoveIcon: false
    },
    listType: 'picture-card',
    beforeUpload: () => false
}

const ReviewDetail = () => {
    const { reviewId } = useParams()
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(true)

    const fetchReview = async () => {
        const response = await getReview(reviewId)
        if (response?.data) {
            setIsLoading(false)
            const data = response?.data
            const review = data?.review
            const product = data?.product

            const thumbnail: UploadFile[] = product?.images
                ?.filter((item) => item.type === 'thumbnail')
                .map((e, idx) => {
                    return {
                        name: idx.toString(),
                        uid: idx.toString(),
                        url: e.imageUrl
                    }
                })

            const gallery: UploadFile[] = product?.images
                ?.filter((item) => item.type === 'gallery')
                .map((e, idx) => {
                    return {
                        name: idx.toString(),
                        uid: idx.toString(),
                        url: e.imageUrl
                    }
                })

            const productDetails = product?.productDetails

            form.setFieldsValue({
                content: review?.content,
                username: review?.idAccount?.userName,
                createdAt: review?.createdAt && dayjs(review.createdAt).format('HH:MM DD-MM-YYYY'),
                updatedAt: review?.updatedAt && dayjs(review.updatedAt).format('HH:MM DD-MM-YYYY'),
                name: product?.name,
                description: product?.description,
                status: product?.status,
                thumbnail: thumbnail,
                gallery: gallery,
                sizes: productDetails,
                email: review?.idAccount?.email
            })
        }
    }

    useEffect(() => {
        fetchReview()
    }, [])

    useEffect(() => {
        console.log(form.getFieldsValue())
    }, [form])
    return (
        <Detail name='Đánh giá' isLoading={isLoading}>
            <Form form={form} layout='vertical'>
                <Form.Item<FieldType> name='content' label='Content'>
                    <Input.TextArea disabled />
                </Form.Item>
                <Form.Item<FieldType> name='username' label='Người đánh giá'>
                    <Input disabled />
                </Form.Item>
                <Form.Item<FieldType> name='email' label='Email'>
                    <Input disabled />
                </Form.Item>
                <Form.Item<FieldType> name='createdAt' label='Thời gian tạo'>
                    <Input disabled />
                </Form.Item>

                <Form.Item<FieldType> name='updatedAt' label='Thời gian chỉnh sửa'>
                    <Input disabled />
                </Form.Item>
                <Form.Item<FieldType> name='name' label='Tên sản phẩm'>
                    <Input readOnly disabled />
                </Form.Item>
                <Form.Item<FieldType> name='description' label='Mô tả sản phẩm'>
                    <Input.TextArea readOnly disabled />
                </Form.Item>
                <Form.Item<FieldType> name='status' label='Trạng thái'>
                    <Input readOnly disabled />
                </Form.Item>
                {/* <Form.Item<FieldType> name='category' label='Danh mục'>
                    <Input readOnly disabled />
                </Form.Item> */}
                <Form.Item name='thumbnail' label='Ảnh đại diện' valuePropName='fileList'>
                    <Upload {...uploadProps} />
                </Form.Item>
                <Form.Item name='gallery' label='Ảnh gallery' valuePropName='fileList'>
                    <Upload {...uploadProps} />
                </Form.Item>
                <Typography>Danh sách size</Typography>
                <br />
                <Form.List name='sizes'>
                    {(fields) => (
                        <div style={{ display: 'flex', rowGap: 12, flexDirection: 'column' }}>
                            {fields.map((field) => (
                                <Card
                                    key={field.key}
                                    title={`Size: ${form.getFieldValue(['sizes', field.name, 'size'])}`}
                                >
                                    <Row gutter={16}>
                                        <Col {...colProps}>
                                            <Form.Item label='Giá nhập' name={[field.name, 'importPrice']}>
                                                <Input readOnly disabled />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Giá niêm yiết' name={[field.name, 'price']}>
                                                <Input readOnly disabled />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Giá bán' name={[field.name, 'promotionalPrice']}>
                                                <Input readOnly disabled />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Số lượng' name={[field.name, 'quantity']}>
                                                <Input readOnly disabled />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </div>
                    )}
                </Form.List>
            </Form>
        </Detail>
    )
}

export default ReviewDetail

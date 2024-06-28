import { useEffect } from 'react'
import { Card, Col, ColProps, Form, Input, Row, Typography, Upload, UploadFile, UploadProps } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { IInfoProduct } from '@/common/interfaces/infoProduct'
import Detail from '@/components/crud/detail'
import { getInfoProduct } from '@/services/infoProduct'
import { getProduct } from '@/services/product'

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

interface FieldType {
    name: string
    description: string
    status: string
    category: string
    thumbnail: UploadFile[]
    gallery: UploadFile[]
    sizes: any
}

const DISABLED_FIELD = true

const DetailProduct = () => {
    const [form] = Form.useForm()
    const { productId } = useParams()
    const navigate = useNavigate()

    const fetchProduct = async () => {
        const product = await getProduct(productId)

        if (product) {
            form.setFieldsValue({
                name: product?.name,
                description: product?.description,
                status: product?.status,
                category: product?.categoryId?.name
            })
        }
    }

    const fetchInfoProduct = async () => {
        const response = await getInfoProduct(productId)
        const data: IInfoProduct = response?.data

        if (data) {
            const thumbnail: UploadFile[] = data?.images
                ?.filter((item) => item.type === 'thumbnail')
                .map((e, idx) => {
                    return {
                        name: idx.toString(),
                        uid: idx.toString(),
                        url: e.imageUrl
                    }
                })

            const gallery: UploadFile[] = data?.images
                ?.filter((item) => item.type === 'gallery')
                .map((e, idx) => {
                    return {
                        name: idx.toString(),
                        uid: idx.toString(),
                        url: e.imageUrl
                    }
                })

            const productDetails = data?.productDetails

            form.setFieldsValue({
                thumbnail: thumbnail,
                gallery: gallery,
                sizes: productDetails
            })
        }
    }

    useEffect(() => {
        fetchProduct()
    }, [])

    useEffect(() => {
        fetchInfoProduct()
    }, [])

    const renderForm = () => {
        return (
            <Form form={form} layout='vertical'>
                <Form.Item<FieldType> name='name' label='Tên sản phẩm'>
                    <Input readOnly disabled={DISABLED_FIELD} />
                </Form.Item>
                <Form.Item<FieldType> name='description' label='Mô tả sản phẩm'>
                    <Input.TextArea readOnly disabled={DISABLED_FIELD} />
                </Form.Item>
                <Form.Item<FieldType> name='status' label='Trạng thái'>
                    <Input readOnly disabled={DISABLED_FIELD} />
                </Form.Item>
                <Form.Item<FieldType> name='category' label='Danh mục'>
                    <Input readOnly disabled={DISABLED_FIELD} />
                </Form.Item>
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
                                                <Input readOnly disabled={DISABLED_FIELD} />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Giá niêm yiết' name={[field.name, 'price']}>
                                                <Input readOnly disabled={DISABLED_FIELD} />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Giá bán' name={[field.name, 'promotionalPrice']}>
                                                <Input readOnly disabled={DISABLED_FIELD} />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item label='Số lượng' name={[field.name, 'quantity']}>
                                                <Input readOnly disabled={DISABLED_FIELD} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </div>
                    )}
                </Form.List>
            </Form>
        )
    }

    return (
        <Detail name='Sản phẩm'>
            <>{renderForm()}</>
        </Detail>
    )
}

export default DetailProduct

import { useEffect, useMemo, useRef, useState } from 'react'

import { PlusOutlined, RedoOutlined, SaveOutlined } from '@ant-design/icons'
import {
    Button,
    Card,
    Checkbox,
    CheckboxOptionType,
    Col,
    ColProps,
    Form,
    FormInstance,
    FormListFieldData,
    FormProps,
    Input,
    Row,
    Select,
    Upload,
    UploadFile,
    UploadProps,
    message
} from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'

import { ICategory } from '@/common/interfaces/category'
import { IAddImageBody } from '@/common/interfaces/image'
import { IAddProductBody } from '@/common/interfaces/product'
import { IProductDetail } from '@/common/interfaces/productDetail'
import { ISize } from '@/common/interfaces/size'
import { STATUS_PRODUCT } from '@/constants/data'
import { getCategorys } from '@/services/category'
import { addImageProduct } from '@/services/image'
import { addProduct } from '@/services/product'
import { addProductDetail } from '@/services/productDetail'
import { getSizes } from '@/services/size'
import { useNavigate } from 'react-router-dom'

interface FieldType {
    name: string
    description: string
    status: string
    categoryId: string
    thumbnail: UploadFile[]
    gallery: UploadFile[]
    sizes: {
        label?: string
        value?: string
        importPrice: string
        price?: string
        promotionalPrice: string
        quantity: string
        sizes?: string
    }[]
    checkedItems?: string[]
}

const colProps: ColProps = {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 6,
    xxl: 6
}

const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type='button'>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>thêm ảnh</div>
    </button>
)

const uploadProps: UploadProps = {
    multiple: true,
    showUploadList: {
        showPreviewIcon: false
    },
    accept: 'image/png, image/jpeg, image/jpg',
    listType: 'picture-card',
    beforeUpload: () => false
}

const normFile = (e: any) => {
    if (Array.isArray(e)) {
        return e
    }
    return e?.fileList
}

// __SCREEN__
const AddProduct: React.FC = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()

    const [categories, setCategories] = useState<ICategory[]>([])
    const [sizes, setSizes] = useState<ISize[]>([])
    const [showBtnUpload, setShowBtnUpload] = useState(true)

    const fetchCategories = async () => {
        const res = await getCategorys()
        const data = res.data
        setCategories(data)
    }

    const fetchSizes = async () => {
        const res = await getSizes()
        const data = res.data
        setSizes(data)
    }

    const options: CheckboxOptionType<string>[] = useMemo(() => {
        return sizes?.map((e) => {
            return {
                label: e.size,
                value: e._id
            }
        })
    }, [sizes])

    const onChangeCheckbox = (e: CheckboxChangeEvent, option: CheckboxOptionType<string>) => {
        const index = options?.findIndex((item) => item.value === e.target.value)
        const checked = e.target.checked

        const list: FieldType['sizes'] = form.getFieldValue('sizes') ?? []

        if (checked) {
            const obj = {
                ...option,
                sizes: option.value
            } as FieldType['sizes'][0]

            const newList = [...list]
            newList.splice(index, 0, obj)
            form.setFieldValue('sizes', newList)
        } else {
            const filteredList = list.filter((item) => item.sizes !== option.value)
            form.setFieldValue('sizes', filteredList)
        }
    }

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const productInput: IAddProductBody = {
            name: values.name,
            description: values.description,
            status: values.status,
            categoryId: values.categoryId
        }

        try {
            const response = await addProduct(productInput)
            const product = response?.datas
            const productId = product?._id

            if (productId) {
                message.success(response.message)
                const thumbnail = values.gallery.map((item) => {
                    return {
                        image: item.thumbUrl, // base64
                        productId: productId,
                        type: 'thumbnail'
                    }
                }) as IAddImageBody[]

                const gallery = values.gallery.map((item) => {
                    return {
                        image: item.thumbUrl, // base64
                        productId: productId,
                        type: 'gallery'
                    }
                }) as IAddImageBody[]

                const imagesInput: IAddImageBody[] = [...thumbnail, ...gallery]

                const productDetailInput = values.sizes.map((item) => {
                    return {
                        quantity: Number(item.quantity),
                        price: Number(item.price),
                        importPrice: Number(item.importPrice),
                        promotionalPrice: Number(item.promotionalPrice),
                        product: productId,
                        sizes: item.sizes
                    }
                }) as IProductDetail[]

                await Promise.allSettled([addImageProduct(imagesInput), addProductDetail(productDetailInput)]).then(
                    (results) => {
                        let allSuccessful = true

                        results.forEach((result) => {
                            if (result.status === 'rejected') {
                                allSuccessful = false
                                result?.reason?.message && message.error(result.reason.message)
                            }
                            if (result.status === 'fulfilled') {
                                result?.value?.message && message.success(result.value.message)
                            }
                        })

                        if (allSuccessful) {
                            form.resetFields()
                            setShowBtnUpload(true)
                            navigate('/admin/products')
                        }
                    }
                )
            }
        } catch (error: any) {
            // console.log(error, 'CREATE_PRODUCT_ERROR')
            message.error(error?.message)
        }
    }

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        // console.log('Failed:', errorInfo)
        message.error('Thiếu thông tin sản phẩm')
    }

    const onSubmitForm = () => {
        form.submit()
    }

    const onClearForm = () => {
        form.resetFields()
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchSizes()
    }, [])

    const validateImportPrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const price = getFieldValue(['sizes', field.name, 'price'])
            const promotionalPrice = getFieldValue(['sizes', field.name, 'promotionalPrice'])

            if (value !== undefined) {
                if (price !== undefined && Number(value) >= Number(price)) {
                    return Promise.reject(new Error('Giá nhập phải nhỏ hơn Giá niêm yết'))
                }
                if (promotionalPrice !== undefined && Number(value) >= Number(promotionalPrice)) {
                    return Promise.reject(new Error('Giá nhập phải nhỏ hơn Giá bán'))
                }
            }

            return Promise.resolve()
        }

    const validatePrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const importPrice = getFieldValue(['sizes', field.name, 'importPrice'])
            const promotionalPrice = getFieldValue(['sizes', field.name, 'promotionalPrice'])

            if (value !== undefined) {
                if (importPrice !== undefined && Number(value) <= Number(importPrice)) {
                    return Promise.reject(new Error('Giá niêm yết phải lớn hơn Giá nhập'))
                }
                if (promotionalPrice !== undefined && Number(value) < Number(promotionalPrice)) {
                    return Promise.reject(new Error('Giá niêm yết phải lớn hơn Giá bán'))
                }
            }

            return Promise.resolve()
        }

    const validatePromotionalPrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const importPrice = getFieldValue(['sizes', field.name, 'importPrice'])
            const price = getFieldValue(['sizes', field.name, 'price'])

            if (value !== undefined) {
                if (importPrice !== undefined && Number(value) <= Number(importPrice)) {
                    console.log('2')
                    return Promise.reject(new Error('Giá bán phải lớn hơn Giá nhập'))
                }
                if (price !== undefined && Number(value) > Number(price)) {
                    console.log(price)
                    return Promise.reject(new Error('Giá bán phải lớn hơn Giá niêm yết'))
                }
            }

            return Promise.resolve()
        }

    return (
        <div className='border p-6'>
            <div className='flex justify-end mb-2 gap-2'>
                <Button
                    type='primary'
                    icon={<RedoOutlined />}
                    size='large'
                    className='bg-[#1677ff]'
                    onClick={onClearForm}
                />
                <Button
                    type='primary'
                    icon={<SaveOutlined />}
                    size='large'
                    className='bg-[#1677ff]'
                    onClick={onSubmitForm}
                />
            </div>
            <Form form={form} onFinish={onFinish} onFinishFailed={onFinishFailed} layout='vertical' autoComplete='off'>
                <Form.Item<FieldType>
                    name='name'
                    label='Tên sản phẩm'
                    rules={[{ required: true, message: 'Tên quá ngắn', min: 6 }]}
                >
                    <Input placeholder='Nhập tên sản phẩm' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='description'
                    label='Mô tả sản phẩm'
                    rules={[{ required: true, message: 'Vui lòng nhập' }]}
                >
                    <Input.TextArea placeholder='Nhập mô tả...' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='status'
                    label='Trạng thái sản phẩm'
                    rules={[{ required: true, message: 'Vui lòng chọn' }]}
                >
                    <Select options={STATUS_PRODUCT} placeholder='Vui lòng chọn' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='categoryId'
                    label='Danh mục'
                    rules={[{ required: true, message: 'Vui lòng chọn' }]}
                >
                    <Select
                        fieldNames={{
                            label: 'name',
                            value: '_id'
                        }}
                        placeholder='Vui lòng chọn'
                        options={categories}
                    />
                </Form.Item>
                <Form.Item<FieldType>
                    name='thumbnail'
                    label='Ảnh đại diện'
                    valuePropName='fileList'
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
                >
                    <Upload
                        {...uploadProps}
                        maxCount={1}
                        multiple={false}
                        onChange={() => {
                            if (form.getFieldValue('thumbnail')?.length !== 0 || !form.getFieldValue('thumbnail')) {
                                setShowBtnUpload(false)
                            }
                        }}
                    >
                        {showBtnUpload && uploadButton}
                    </Upload>
                </Form.Item>
                <br />
                <Form.Item<FieldType>
                    name='gallery'
                    label='Ảnh gallery'
                    valuePropName='fileList'
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
                >
                    <Upload {...uploadProps}>{uploadButton}</Upload>
                </Form.Item>
                <br />
                <Form.Item<FieldType>
                    name='checkedItems'
                    label='Danh sách size'
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng chọn size'
                        }
                    ]}
                >
                    <Checkbox.Group>
                        {options.map((option) => {
                            return (
                                <Checkbox
                                    key={option.value}
                                    onChange={(e) => onChangeCheckbox(e, option)}
                                    value={option.value}
                                >
                                    {option.label}
                                </Checkbox>
                            )
                        })}
                    </Checkbox.Group>
                </Form.Item>
                <Form.List name='sizes'>
                    {(fields) => (
                        <div style={{ display: 'flex', rowGap: 12, flexDirection: 'column' }}>
                            {fields.map((field) => (
                                <Card
                                    size='small'
                                    title={`Size: ${form.getFieldValue(['sizes', field.name, 'label'])}`}
                                    key={field.key}
                                >
                                    <Row gutter={16}>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá nhập'
                                                name={[field.name, 'importPrice']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập' },
                                                    { validator: validateImportPrice(form.getFieldValue, field) }
                                                ]}
                                                dependencies={[
                                                    ['sizes', field.name, 'price'],
                                                    ['sizes', field.name, 'promotionalPrice']
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá nhập' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá niêm yiết'
                                                name={[field.name, 'price']}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Vui lòng nhập'
                                                    },
                                                    { validator: validatePrice(form.getFieldValue, field) }
                                                ]}
                                                dependencies={[
                                                    ['sizes', field.name, 'importPrice'],
                                                    ['sizes', field.name, 'promotionalPrice']
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá niêm yiết' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá bán'
                                                name={[field.name, 'promotionalPrice']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập' },
                                                    { validator: validatePromotionalPrice(form.getFieldValue, field) }
                                                ]}
                                                dependencies={[
                                                    ['sizes', field.name, 'importPrice'],
                                                    ['sizes', field.name, 'price']
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá bán' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Số lượng'
                                                name={[field.name, 'quantity']}
                                                rules={[{ required: true, message: 'Vui lòng nhập' }]}
                                            >
                                                <Input type='number' min={1} placeholder='Số lượng' />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </div>
                    )}
                </Form.List>
                <Button type='primary' size='large' className='bg-[#1677ff]' onClick={onSubmitForm}>
                    Lưu
                </Button>
            </Form>
        </div>
    )
}

export default AddProduct

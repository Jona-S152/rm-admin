"use client";

import {
  List,
  useTable,
  useModalForm,
  DeleteButton,
} from "@refinedev/antd";
import { type BaseRecord, useMany } from "@refinedev/core";
import { Space, Table, Modal, Button, Form, Input, Select, } from "antd";

export default function BlogPostList() {
  const { result, tableProps, setFilters } = useTable({
    syncWithLocation: true,
    meta: {
      select: "*, categories(id,title)",
    },
  });

  const {
    result: { data: categories },
    query: { isLoading: categoriesLoading },
  } = useMany({
    resource: "categories",
    ids:
      result?.data?.map((item) => item?.categories?.id).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal
  } = useModalForm({
    action: 'create',
    resource: 'blog-posts',
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm({
    action: 'edit',
    resource: 'blog_posts',
  });

  return (
    <List
      headerButtons={() => (
        <Button type="primary" onClick={() => showCreateModal()}>
          Crear blog post
        </Button>
      )}>
      <Space.Compact>
      <Input placeholder="Buscar..." />
        <Button type="primary">Buscar</Button>
      </Space.Compact>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title={"ID"} />
        <Table.Column dataIndex="title" title={"Title"} />
        <Table.Column
          dataIndex={"categories"}
          title={"Category"}
          render={(value) =>
            categoriesLoading ? (
              <>Loading...</>
            ) : (
              categories?.find((item) => item.id === value?.id)?.title
            )
          }
        />
        <Table.Column dataIndex="status" title={"Status"} />
        
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              <Button size="small" onClick={() => showEditModal(record.id)}>
                Editar
              </Button>
              <DeleteButton recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>

       {/* MODAL CREAR */}
      <Modal {...createModalProps} title="Crear Blog Post">
        <Form {...createFormProps} layout="vertical">
          <Form.Item name="title" label="Título">
            <Input />
          </Form.Item>

          <Form.Item name="content" label="Contenido">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name={["categories", "id"]} label="Categoría">
            <Select>
              {categories?.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal {...editModalProps} title="Editar Blog Post">
        <Form {...editFormProps} layout="vertical">
          <Form.Item name="title" label="Título">
            <Input />
          </Form.Item>

          <Form.Item name="content" label="Contenido">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name={["categories", "id"]} label="Categoría">
            <Select>
              {categories?.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
}

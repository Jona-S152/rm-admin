"use client";

import { useTable, List } from "@refinedev/antd";
import { Button, Modal, Space, Table, Input } from "antd";
import { useState } from "react";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

import { StopForm } from "./stop-form";

export default function StopsList() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { tableProps, searchFormProps } = useTable({
    syncWithLocation: true,
    onSearch: (values) => {
        return [
            {
            field: "location",
            operator: "contains",
            value: (values as any).q,
            },
        ];
    },
  });

  return (
    <List title="Stops">
      <form {...searchFormProps}>
        <Input.Search
          placeholder="Search stop..."
          enterButton
          style={{ marginBottom: 20, maxWidth: 300 }}
        />
      </form>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingId(null);
          setModalVisible(true);
        }}
        style={{ marginBottom: 20 }}
      >
        Create Stop
      </Button>

      <Table {...tableProps} rowKey="id">
        <Table.Column title="ID" dataIndex="id" />
        <Table.Column title="Route ID" dataIndex="route_id" />
        <Table.Column title="Location" dataIndex="location" />
        <Table.Column title="Order" dataIndex="stop_order" />

        <Table.Column
          title="Actions"
          render={(record: any) => (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingId(record.id);
                  setModalVisible(true);
                }}
              />
            </Space>
          )}
        />
      </Table>

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <StopForm
          id={editingId}
          onSuccess={() => setModalVisible(false)}
        />
      </Modal>
    </List>
  );
}

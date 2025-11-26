"use client";

import { useTable } from "@refinedev/antd";
import { Button, Table, Space, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { StopForm } from "@app/stops/stop-form";
import { useState } from "react";
import { supabaseBrowserClient } from "@utils/supabase/client";

export function StopsManager({ routeId }: { routeId: number | undefined }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ❗CORRECTO para componentes cliente
  const supabase = supabaseBrowserClient;

  const { tableProps, tableQuery } = useTable({
    resource: "stops",
    filters: {
      initial: [
        {
          field: "route_id",
          operator: "eq",
          value: routeId,
        },
      ],
    },
    syncWithLocation: false,
  });

  const deleteStop = async (id: number) => {
    await supabase.from("stops").delete().eq("id", id);
    tableQuery.refetch();
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingId(null);
          setModalVisible(true);
        }}
        style={{ marginBottom: 20 }}
      >
        Add Stop
      </Button>

      <Table {...tableProps} rowKey="id">
        <Table.Column title="ID" dataIndex="id" />
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

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteStop(record.id)}
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
          routeId={routeId}
          onSuccess={() => {
            setModalVisible(false);
            tableQuery.refetch();
          }}
        />
      </Modal>
    </>
  );
}

"use client";

import { useTable, List } from "@refinedev/antd";
import { Button, Modal, Space, Table, Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { EditOutlined, EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";

import { RouteForm } from "./route-form";
import { StopsManager } from "@components/stops-manager";
import { RouteMapModal } from "@components/route-map-modal";
import { supabaseBrowserClient } from "@utils/supabase/client";

// ❗CORRECTO para componentes cliente
const supabase = supabaseBrowserClient;

type SearchForm = {
  q?: string;
};

export async function getStopsForRoute(routeId: number) {
  const { data, error } = await supabase
    .from("stops")
    .select("latitude, longitude, location")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  if (error) {
    console.error("Error fetching stops:", error);
    return [];
  }

  return data ?? [];
}

export default function RoutesList() {
    const go = useGo();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [stopsModalOpen, setStopsModalOpen] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState<number>();

    const [data, setData] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);

    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapStops, setMapStops] = useState<{ latitude: number; longitude: number }[]>([]);

    const [mapModalStartLocation, setMapModalStartLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);
    const [mapModalEndLocation, setMapModalEndLocation] = useState<{ latitude: number; longitude: number; name?: string } | null>(null);

    const { tableProps, searchFormProps, tableQuery } = useTable({
        syncWithLocation: false,

        onSearch: (values : SearchForm) => {
            const search = values.q;

            if (!search) return [];

            return [
            {
                field: "start_location",
                operator: "contains",
                value: search,
            },
            {
                field: "end_location",
                operator: "contains",
                value: search,
            },
            ];
        },
    });

    
    useEffect(() => {
        if (tableQuery.data?.data) {
            setData(tableQuery.data.data);
            setFiltered(tableQuery.data.data);
        }
    }, [tableQuery.data]);

    const handleSearch = (value: string) => {
        const txt = value.toLowerCase();

        const result = data.filter((item) =>
            item.start_location.toLowerCase().includes(txt) ||
            item.end_location.toLowerCase().includes(txt)
        );

        setFiltered(result);
    };


return (
    <List title="Routes" headerButtons={() => null}>
      {/* BUSCADOR */}
      <form {...searchFormProps}>
        <Input
            placeholder="Buscar por ubicación inicial o final"
            style={{ marginBottom: 20, maxWidth: 300 }}
            onChange={(e) => handleSearch(e.target.value)}
        />
      </form>

      {/* BOTÓN CREAR */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingId(null);
          setModalVisible(true);
        }}
        style={{ marginBottom: 20 }}
      >
        Create Route
      </Button>

      {/* TABLA */}
      <Table {...tableProps} dataSource={filtered} rowKey="id">
        <Table.Column title="ID" dataIndex="id" />
        <Table.Column title="Inicio" dataIndex="start_location" />
        <Table.Column title="Fin" dataIndex="end_location" />
        <Table.Column title="Creado" dataIndex="created_at" />

        <Table.Column
          title="Acciones"
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
                    icon={<EnvironmentOutlined />}
                    onClick={() => {
                        setSelectedRouteId(record.id);
                        setStopsModalOpen(true);
                    }}
                    >
                    Manage Stops
                </Button>

                <Button
                    onClick={async () => {
                        if (!record.id) return;

                        setSelectedRouteId(record.id);

                        const stops = await getStopsForRoute(record.id);
                        setMapStops(stops);

                        setMapModalOpen(true);
                        setMapModalStartLocation({
                            latitude: record.start_latitude,
                            longitude: record.start_longitude,
                            name: record.start_location,
                        });
                        setMapModalEndLocation({
                            latitude: record.end_latitude,
                            longitude: record.end_longitude,
                            name: record.end_location,
                        });
                    }}
                >
                    View Route
                </Button>
            </Space>
          )}
        />
      </Table>

      {/* MODAL CREATE/EDIT */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <RouteForm
          id={editingId}
          onSuccess={() => setModalVisible(false)}
        />
      </Modal>

        <Modal
            open={stopsModalOpen}
            onCancel={() => setStopsModalOpen(false)}
            footer={null}
            width={800}
            destroyOnClose
            >
            <StopsManager routeId={selectedRouteId} />
        </Modal>

        <Modal
            open={mapModalOpen}
            onCancel={() => setMapModalOpen(false)}
            footer={null}
            width={800}
        >
            <RouteMapModal startLocation={mapModalStartLocation!} endLocation={mapModalEndLocation!} routeId={selectedRouteId} stops={mapStops} onClose={() => setMapModalOpen(false)} />
        </Modal>

    </List>
  );
}


"use client";

import { useTable, List } from "@refinedev/antd";
import { Button, Modal, Space, Table, Input } from "antd";
import { useEffect, useState } from "react";
import { EditOutlined, EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";

import { RouteForm } from "./route-form";
import { StopsManager } from "@components/stops-manager";
import { RouteMapModal } from "@components/route-map-modal";
import { supabaseBrowserClient } from "@utils/supabase/client";

// Parse a PostGIS geometry value returned by Supabase.
// Supabase can return it as a GeoJSON object { type: "Point", coordinates: [lng, lat] }
// or as a WKT string "POINT(lng lat)".
function parseCoords(value: any): { latitude: number; longitude: number } {
  if (!value) return { latitude: 0, longitude: 0 };

  if (value?.type === "Point" && Array.isArray(value.coordinates)) {
    return { longitude: value.coordinates[0], latitude: value.coordinates[1] };
  }

  if (typeof value === "string") {
    const match = value.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
  }

  return { latitude: 0, longitude: 0 };
}

// ❗CORRECTO para componentes cliente
const supabase = supabaseBrowserClient;

type SearchForm = {
  q?: string;
};

async function getStopsForRoute(routeId: number) {
  const { data, error } = await supabase
    .from("stops")
    .select("coords::json, location, stop_order")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  if (error) {
    console.error("Error fetching stops:", error);
    return [];
  }

  return data ?? [];
}

export default function RoutesList() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [stopsModalOpen, setStopsModalOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number>();

  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapStops, setMapStops] = useState<{ coords: { latitude: number; longitude: number } }[]>([]);

  const [mapModalStartLocation, setMapModalStartLocation] = useState<{ coords: { latitude: number; longitude: number }; name?: string } | null>(null);
  const [mapModalEndLocation, setMapModalEndLocation] = useState<{ coords: { latitude: number; longitude: number }; name?: string } | null>(null);

  const { tableProps, searchFormProps, tableQuery } = useTable({
    syncWithLocation: false,
    // Cast geometry columns to JSON so parseCoords can read them as GeoJSON
    meta: { select: "*, start_coords::json, end_coords::json" },

    onSearch: (values: SearchForm) => {
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

                  const rawStops = await getStopsForRoute(record.id);
                  // Normalize coords from PostGIS geometry to { latitude, longitude }
                  const stops = rawStops.map((s: any) => ({
                    ...s,
                    coords: parseCoords(s.coords),
                  }));
                  setMapStops(stops);

                  setMapModalOpen(true);
                  setMapModalStartLocation({
                    coords: parseCoords(record.start_coords),
                    name: record.start_location,
                  });
                  setMapModalEndLocation({
                    coords: parseCoords(record.end_coords),
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


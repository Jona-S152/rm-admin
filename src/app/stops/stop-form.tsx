"use client";

import MapSelector from "@components/map-selector";
import { useForm } from "@refinedev/antd";
import { Form, Input, Button, Modal, message } from "antd";
import { useState } from "react";

const toPoint = (lat: number, lng: number) => `POINT(${lng} ${lat})`;

const parseCoords = (
  value: any
): { latitude: number; longitude: number } | undefined => {
  if (!value) return undefined;

  if (value?.type === "Point" && Array.isArray(value.coordinates)) {
    const [lng, lat] = value.coordinates;
    if (isFinite(lng) && isFinite(lat)) return { longitude: lng, latitude: lat };
  }

  if (typeof value === "string" && !value.startsWith("01")) {
    const match = value.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (isFinite(lng) && isFinite(lat)) return { longitude: lng, latitude: lat };
    }
  }

  return undefined;
};

export const StopForm = ({ id, onSuccess, routeId }: any) => {
  const { formProps, saveButtonProps, form } = useForm({
    resource: "stops",
    redirect: false,
    id,
    action: id ? "edit" : "create",
    // Cast geometry to GeoJSON so parseCoords can read it on edit
    meta: { select: "*, coords::json" },
    onMutationSuccess: () => onSuccess?.(),
    onMutationError: (err: any) => {
      console.error("Stop mutation error:", err);
      message.error("Error al guardar la parada");
    },
  });

  const [openMap, setOpenMap] = useState(false);

  const getCurrentCoords = (): { latitude: number; longitude: number } | undefined => {
    const lat = form.getFieldValue("_lat");
    const lng = form.getFieldValue("_lng");
    if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return parseCoords(form.getFieldValue("coords"));
  };

  return (
    <>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={async (values: any) => {
          const lat = values._lat;
          const lng = values._lng;
          const hasCoords = lat != null && lng != null;

          if (!id && !hasCoords) {
            message.warning("Selecciona la ubicación en el mapa");
            return;
          }

          const payload: Record<string, any> = {
            route_id:   values.route_id ?? routeId,
            location:   values.location,
            stop_order: values.stop_order,
          };

          if (hasCoords) payload.coords = toPoint(lat, lng);

          await formProps.onFinish?.(payload);
        }}
      >
        {/* Staging fields */}
        <Form.Item name="_lat"   hidden noStyle><Input /></Form.Item>
        <Form.Item name="_lng"   hidden noStyle><Input /></Form.Item>
        <Form.Item name="coords" hidden noStyle><Input /></Form.Item>

        <Form.Item name="route_id" initialValue={routeId} hidden noStyle>
          <Input />
        </Form.Item>

        <Form.Item
          label="Location Name"
          name="location"
          rules={[{ required: true, message: "Ingresa el nombre del lugar" }]}
        >
          <Input placeholder="Ej: Parada Centro" />
        </Form.Item>

        <Button
          type="default"
          onClick={() => setOpenMap(true)}
          block
          style={{ marginBottom: 12 }}
        >
          {getCurrentCoords() ? "✅ Ubicación seleccionada — cambiar" : "📍 Seleccionar ubicación en el mapa"}
        </Button>

        <Form.Item
          label="Stop Order"
          name="stop_order"
          rules={[{ required: true, message: "Ingresa el orden de la parada" }]}
        >
          <Input min={1} type="number" />
        </Form.Item>

        <Button type="primary" {...saveButtonProps} block>
          {id ? "Actualizar Parada" : "Crear Parada"}
        </Button>
      </Form>

      <Modal
        open={openMap}
        onCancel={() => setOpenMap(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <h3>Selecciona la ubicación en el mapa</h3>
        <MapSelector
          value={getCurrentCoords()}
          onChange={async ({ latitude, longitude }) => {
            form.setFieldsValue({ _lat: latitude, _lng: longitude });

            try {
              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
              );
              const data = await res.json();
              const placeName = data?.features?.[0]?.place_name;
              if (placeName) form.setFieldsValue({ location: placeName });
            } catch {
              // geocoding is optional, ignore errors
            }

            setOpenMap(false);
          }}
        />
      </Modal>
    </>
  );
};

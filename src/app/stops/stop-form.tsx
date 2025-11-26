"use client";

import MapSelector from "@components/map-selector";
import { useForm } from "@refinedev/antd";
import { Form, Input, Button, Modal } from "antd";
import { useState } from "react";

export const StopForm = ({ id, onSuccess, routeId }: any) => {
  const { formProps, saveButtonProps, form } = useForm({
    resource: "stops",
    redirect: false,
    id,
    action: id ? "edit" : "create",
    meta: { select: "*" },
  });

  const [ openMap , setOpenMap ] = useState(false);

  return (
    <>
        <Form 
            {...formProps} 
            layout="vertical" 
            onFinish={async (values) => {
                await formProps.onFinish?.(values);
                onSuccess();
        }}>
        <Form.Item name="route_id" initialValue={routeId} hidden>
            <Input type="hidden" />
        </Form.Item>

        <Form.Item label="Location Name" name="location" rules={[{ required: true }]}>
            <Input />
        </Form.Item>

        <Form.Item label="Latitude" name="latitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

        <Form.Item label="Longitude" name="longitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

            {/* 🔥 Botón para abrir el mapa */}
            <Button
                type="default"
                onClick={() => setOpenMap(true)}
                block
                style={{ marginBottom: 12 }}
            >
                Seleccionar ubicación en el mapa
            </Button>

        <Form.Item label="Stop Order" name="stop_order" rules={[{ required: true }]}>
            <Input min={1} type="number" />
        </Form.Item>

        <Button type="primary" {...saveButtonProps} block>
            {id ? "Update" : "Create"}
        </Button>
        </Form>

        <Modal
            open={openMap}
            onCancel={() => setOpenMap(false)}
            footer={null}
            width={650}
            >
            <h3>Selecciona la ubicación en el mapa</h3>

            <MapSelector
                value={{
                latitude: form.getFieldValue("latitude"),
                longitude: form.getFieldValue("longitude"),
                }}
                onChange={async ({ latitude, longitude }) => {
                // Guardar lat/lng
                form.setFieldsValue({
                    latitude,
                    longitude,
                });

                // OPCIONAL → obtener dirección automáticamente
                try {
                    const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
                    );
                    const data = await res.json();
                    const placeName = data?.features?.[0]?.place_name;

                    if (placeName) {
                    form.setFieldsValue({ location: placeName });
                    }
                } catch (err) {
                    console.log("Geocoding error", err);
                }

                setOpenMap(false);
                }}
        />
        </Modal>
    </>
  );
};

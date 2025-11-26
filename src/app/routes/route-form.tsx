"use client";

import MapSelector from "@components/map-selector";
import { useForm } from "@refinedev/antd";
import { Form, Input, Button, Modal } from "antd";
import { useState } from "react";

export const RouteForm = ({ id, onSuccess }: any) => {
  const { formProps, saveButtonProps, form } = useForm({
    resource: "routes",
    id,
    action: id ? "edit" : "create",
    meta: { select: "*" },
  });

  const [ openMapStart, setOpenMapStart ] = useState(false);
  const [ openMapEnd, setOpenMapEnd ] = useState(false);

  const fetchLocationName = async (latitude: number, longitude: number) => {
    try {

        const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        return data.features[0]?.place_name || "";
    } catch (error) {
        console.error("Error fetching location name:", error);
        return "";
    }
  }

  return (
    <>
        <Form 
            {...formProps} 
            layout="vertical" 
            onFinish={async (values) => {
                await formProps.onFinish?.(values);
                onSuccess();
            }}
        >
        <Form.Item
            label="Start Location"
            name="start_location"
            rules={[{ required: true }]}
        >
            <Input />
        </Form.Item>

        <Form.Item label="Start Latitude" name="start_latitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

        <Form.Item label="Start Longitude" name="start_longitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

        <Button
          block
          onClick={() => setOpenMapStart(true)}
          style={{ marginBottom: 20 }}
        >
          Seleccionar ubicación de inicio en el mapa
        </Button>

        <Form.Item
            label="End Location"
            name="end_location"
            rules={[{ required: true }]}
        >
            <Input />
        </Form.Item>

        <Form.Item label="End Latitude" name="end_latitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

        <Form.Item label="End Longitude" name="end_longitude" rules={[{ required: true }]}>
            <Input type="number" />
        </Form.Item>

        <Button
          block
          onClick={() => setOpenMapEnd(true)}
          style={{ marginBottom: 20 }}
        >
          Seleccionar ubicación final en el mapa
        </Button>

        <Button type="primary" {...saveButtonProps} block>
            {id ? "Update" : "Create"}
        </Button>
        </Form>

        <Modal
        open={openMapStart}
        onCancel={() => setOpenMapStart(false)}
        footer={null}
        width={650}
      >
        <h3>Selecciona la ubicación de inicio</h3>

        {/* MAPA INICIO */}
        <MapSelector
            value={{
                latitude: form.getFieldValue("start_latitude"),
                longitude: form.getFieldValue("start_longitude"),
            }}
            onChange={async ({ latitude, longitude }) => {
                const placeName = await fetchLocationName(latitude, longitude);

                form.setFieldsValue({
                start_latitude: latitude,
                start_longitude: longitude,
                start_location: placeName || form.getFieldValue("start_location"),
                });

                setOpenMapStart(false);
            }}
            />
        </Modal>

        {/* MAPA FINAL */}
        <Modal
            open={openMapEnd}
            onCancel={() => setOpenMapEnd(false)}
            footer={null}
            width={650}
        >
            <h3>Selecciona la ubicación final</h3>

            <MapSelector
            value={{
                latitude: form.getFieldValue("end_latitude"),
                longitude: form.getFieldValue("end_longitude"),
            }}
            onChange={async ({ latitude, longitude }) => {
                const placeName = await fetchLocationName(latitude, longitude);

                form.setFieldsValue({
                end_latitude: latitude,
                end_longitude: longitude,
                end_location: placeName || form.getFieldValue("end_location"),
                });

                setOpenMapEnd(false);
            }}
            />
        </Modal>
    </>
  );
};

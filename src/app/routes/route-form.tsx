"use client";

import MapSelector from "@components/map-selector";
import { useForm } from "@refinedev/antd";
import { Form, Input, Button, Modal, message } from "antd";
import { useState } from "react";

// Build a PostGIS WKT POINT string — Supabase/PostGIS accepts this on insert/update
const toPoint = (lat: number, lng: number) => `POINT(${lng} ${lat})`;

// Parse whatever Supabase returns from a geometry column:
// • GeoJSON object  { type: "Point", coordinates: [lng, lat] }
// • WKT string      "POINT(lng lat)"
// • Hex EWKB string (starts with "0101...")  → we cannot decode client-side, return null
const parseCoords = (
    value: any
): { latitude: number; longitude: number } | undefined => {
    if (!value) return undefined;

    // GeoJSON (most common when using .select() without a cast)
    if (value?.type === "Point" && Array.isArray(value.coordinates)) {
        const [lng, lat] = value.coordinates;
        if (isFinite(lng) && isFinite(lat)) return { longitude: lng, latitude: lat };
    }

    // WKT string
    if (typeof value === "string" && !value.startsWith("01")) {
        const match = value.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
        if (match) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            if (isFinite(lng) && isFinite(lat)) return { longitude: lng, latitude: lat };
        }
    }

    // Hex EWKB — cannot parse without a library; return undefined so the map shows no marker
    return undefined;
};

export const RouteForm = ({ id, onSuccess }: any) => {
    const { formProps, saveButtonProps, form } = useForm({
        resource: "routes",
        id,
        action: id ? "edit" : "create",
        // Ask Supabase to cast geometry to GeoJSON so parseCoords can read it
        meta: { select: "*, start_coords::json, end_coords::json" },
        redirect: false,
        onMutationSuccess: () => onSuccess?.(),
        onMutationError: (err: any) => {
            console.error("Mutation error:", err);
            message.error("Error al guardar la ruta");
        },
    });

    const [openMapStart, setOpenMapStart] = useState(false);
    const [openMapEnd, setOpenMapEnd] = useState(false);

    const fetchLocationName = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const data = await response.json();
            return (data.features?.[0]?.place_name as string) ?? "";
        } catch {
            return "";
        }
    };

    // Returns parsed coords for the map preview, or undefined if nothing picked yet
    const getStartCoords = (): { latitude: number; longitude: number } | undefined => {
        // Priority 1: user already picked via map (staging fields)
        const lat = form.getFieldValue("_start_lat");
        const lng = form.getFieldValue("_start_lng");
        if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
            return { latitude: lat, longitude: lng };
        }
        // Priority 2: editing — value loaded from DB
        return parseCoords(form.getFieldValue("start_coords"));
    };

    const getEndCoords = (): { latitude: number; longitude: number } | undefined => {
        const lat = form.getFieldValue("_end_lat");
        const lng = form.getFieldValue("_end_lng");
        if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
            return { latitude: lat, longitude: lng };
        }
        return parseCoords(form.getFieldValue("end_coords"));
    };

    return (
        <>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={async (values: any) => {
                    const startLat = values._start_lat;
                    const startLng = values._start_lng;
                    const endLat = values._end_lat;
                    const endLng = values._end_lng;

                    const hasStart = startLat != null && startLng != null;
                    const hasEnd = endLat != null && endLng != null;

                    // On create both coords are mandatory
                    if (!id) {
                        if (!hasStart) {
                            message.warning("Selecciona la ubicación de inicio en el mapa");
                            return;
                        }
                        if (!hasEnd) {
                            message.warning("Selecciona la ubicación final en el mapa");
                            return;
                        }
                    }

                    // Build a clean payload — never send raw geometry objects back
                    const payload: Record<string, any> = {
                        start_location: values.start_location,
                        end_location: values.end_location,
                    };

                    if (hasStart) payload.start_coords = toPoint(startLat, startLng);
                    if (hasEnd) payload.end_coords = toPoint(endLat, endLng);

                    await formProps.onFinish?.(payload);
                }}
            >
                {/* Internal staging fields — never sent to Supabase directly */}
                <Form.Item name="_start_lat" hidden noStyle><Input /></Form.Item>
                <Form.Item name="_start_lng" hidden noStyle><Input /></Form.Item>
                <Form.Item name="_end_lat" hidden noStyle><Input /></Form.Item>
                <Form.Item name="_end_lng" hidden noStyle><Input /></Form.Item>

                {/* Loaded by Refine on edit — kept so form.getFieldValue works */}
                <Form.Item name="start_coords" hidden noStyle><Input /></Form.Item>
                <Form.Item name="end_coords" hidden noStyle><Input /></Form.Item>

                <Form.Item
                    label="Start Location"
                    name="start_location"
                    rules={[{ required: true, message: "Ingresa la ubicación de inicio" }]}
                >
                    <Input placeholder="Ej: Terminal Norte, Guayaquil" />
                </Form.Item>

                <Button
                    block
                    onClick={() => setOpenMapStart(true)}
                    style={{ marginBottom: 20 }}
                >
                    {getStartCoords() ? "✅ Inicio seleccionado — cambiar" : "📍 Seleccionar inicio en el mapa"}
                </Button>

                <Form.Item
                    label="End Location"
                    name="end_location"
                    rules={[{ required: true, message: "Ingresa la ubicación final" }]}
                >
                    <Input placeholder="Ej: Aeropuerto, Guayaquil" />
                </Form.Item>

                <Button
                    block
                    onClick={() => setOpenMapEnd(true)}
                    style={{ marginBottom: 20 }}
                >
                    {getEndCoords() ? "✅ Fin seleccionado — cambiar" : "📍 Seleccionar fin en el mapa"}
                </Button>

                <Button type="primary" {...saveButtonProps} block>
                    {id ? "Actualizar Ruta" : "Crear Ruta"}
                </Button>
            </Form>

            {/* MAPA INICIO */}
            <Modal
                open={openMapStart}
                onCancel={() => setOpenMapStart(false)}
                footer={null}
                width={650}
                destroyOnClose
            >
                <h3>Selecciona la ubicación de inicio</h3>
                <MapSelector
                    value={getStartCoords()}
                    onChange={async ({ latitude, longitude }) => {
                        const placeName = await fetchLocationName(latitude, longitude);
                        form.setFieldsValue({
                            _start_lat: latitude,
                            _start_lng: longitude,
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
                destroyOnClose
            >
                <h3>Selecciona la ubicación final</h3>
                <MapSelector
                    value={getEndCoords()}
                    onChange={async ({ latitude, longitude }) => {
                        const placeName = await fetchLocationName(latitude, longitude);
                        form.setFieldsValue({
                            _end_lat: latitude,
                            _end_lng: longitude,
                            end_location: placeName || form.getFieldValue("end_location"),
                        });
                        setOpenMapEnd(false);
                    }}
                />
            </Modal>
        </>
    );
};

package com.saferoad.controller.dto;

import java.time.LocalDateTime;

import com.saferoad.entity.SafetyZone;


public record SafetyZoneResponse(
        Long id,
        String name,
        String zoneType,
        String location,
        Double latitude,
        Double longitude,
        Double radius,
        Integer speedLimit,
        Boolean active,
        String description,
        LocalDateTime createdAt
) {

    // Entity ko safe API response mein convert karta hai
    public static SafetyZoneResponse fromEntity(
            SafetyZone safetyZone) {

        return new SafetyZoneResponse(
                safetyZone.getId(),
                safetyZone.getName(),
                safetyZone.getZoneType(),
                safetyZone.getLocation(),
                safetyZone.getLatitude(),
                safetyZone.getLongitude(),
                safetyZone.getRadius(),
                safetyZone.getSpeedLimit(),
                safetyZone.getActive(),
                safetyZone.getDescription(),
                safetyZone.getCreatedAt()
        );
    }
}
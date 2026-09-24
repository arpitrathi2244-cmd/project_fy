package com.saferoad.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saferoad.controller.dto.SafetyZoneResponse;
import com.saferoad.entity.SafetyZone;
import com.saferoad.repository.SafetyZoneRepository;


@RestController
@RequestMapping("/api/safety-zones")
public class SafetyZoneController {

    private final SafetyZoneRepository safetyZoneRepository;


    public SafetyZoneController(
            SafetyZoneRepository safetyZoneRepository) {

        this.safetyZoneRepository = safetyZoneRepository;
    }


    // ============================================================
    // CREATE SAFETY ZONE
    // POST /api/safety-zones
    // ============================================================

    @PostMapping
    public ResponseEntity<?> createSafetyZone(
            @RequestBody SafetyZone safetyZone) {

        try {

            // Creation time automatically set karo
            if (safetyZone.getCreatedAt() == null) {
                safetyZone.setCreatedAt(LocalDateTime.now());
            }


            // Active by default
            if (safetyZone.getActive() == null) {
                safetyZone.setActive(true);
            }


            // Database mein save karo
            SafetyZone savedZone =
                    safetyZoneRepository.save(safetyZone);


            // Safe DTO response
            SafetyZoneResponse response =
                    SafetyZoneResponse.fromEntity(savedZone);


            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (Exception exception) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(exception.getMessage());
        }
    }


    // ============================================================
    // GET ALL ACTIVE SAFETY ZONES
    // GET /api/safety-zones
    // ============================================================

    @GetMapping
    public ResponseEntity<List<SafetyZoneResponse>>
    getActiveSafetyZones() {

        List<SafetyZoneResponse> response =
                safetyZoneRepository
                        .findByActiveTrue()
                        .stream()
                        .map(SafetyZoneResponse::fromEntity)
                        .toList();


        return ResponseEntity.ok(response);
    }


    // ============================================================
    // GET SAFETY ZONE BY ID
    // GET /api/safety-zones/{id}
    // ============================================================

    @GetMapping("/{id}")
    public ResponseEntity<?> getSafetyZoneById(
            @PathVariable Long id) {

        return safetyZoneRepository
                .findById(id)
                .map(zone ->
                        ResponseEntity.ok(
                                SafetyZoneResponse.fromEntity(zone)
                        )
                )
                .orElseGet(() ->
                        ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(null)
                );
    }


    // ============================================================
    // GET ZONES BY TYPE
    // GET /api/safety-zones/type/{zoneType}
    // ============================================================

    @GetMapping("/type/{zoneType}")
    public ResponseEntity<List<SafetyZoneResponse>>
    getZonesByType(
            @PathVariable String zoneType) {

        List<SafetyZoneResponse> response =
                safetyZoneRepository
                        .findByZoneTypeIgnoreCase(zoneType)
                        .stream()
                        .map(SafetyZoneResponse::fromEntity)
                        .toList();


        return ResponseEntity.ok(response);
    }
}
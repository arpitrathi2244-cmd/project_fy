package com.saferoad.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saferoad.entity.SafetyZone;


public interface SafetyZoneRepository
        extends JpaRepository<SafetyZone, Long> {

    // Active safety zones
    List<SafetyZone> findByActiveTrue();

    // Zone type ke according search
    List<SafetyZone> findByZoneTypeIgnoreCase(
            String zoneType
    );

    // Location ke according search
    List<SafetyZone> findByLocationContainingIgnoreCase(
            String location
    );

    // Active zones of a particular type
    List<SafetyZone> findByZoneTypeIgnoreCaseAndActiveTrue(
            String zoneType
    );
}
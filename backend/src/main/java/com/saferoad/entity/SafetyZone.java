package com.saferoad.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "safety_zones")
public class SafetyZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // Zone ka naam
    @Column(nullable = false, length = 150)
    private String name;


    // Zone type
    // SCHOOL, HOSPITAL, HILL_AREA, WILDLIFE,
    // ACCIDENT_PRONE, CONSTRUCTION
    @Column(nullable = false, length = 50)
    private String zoneType;


    // Zone location
    @Column(nullable = false, length = 255)
    private String location;


    // GPS coordinates
    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;


    // Zone ka radius meters mein
    @Column(nullable = false)
    private Double radius;


    // Zone mein recommended speed limit
    @Column
    private Integer speedLimit;


    // Zone active hai ya nahi
    @Column(nullable = false)
    private Boolean active = true;


    // Additional information
    @Column(length = 1000)
    private String description;


    // Record creation time
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;


    // Default constructor required by JPA
    public SafetyZone() {
    }


    public Long getId() {
        return id;
    }


    public String getName() {
        return name;
    }


    public String getZoneType() {
        return zoneType;
    }


    public String getLocation() {
        return location;
    }


    public Double getLatitude() {
        return latitude;
    }


    public Double getLongitude() {
        return longitude;
    }


    public Double getRadius() {
        return radius;
    }


    public Integer getSpeedLimit() {
        return speedLimit;
    }


    public Boolean getActive() {
        return active;
    }


    public String getDescription() {
        return description;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public void setName(String name) {
        this.name = name;
    }


    public void setZoneType(String zoneType) {
        this.zoneType = zoneType;
    }


    public void setLocation(String location) {
        this.location = location;
    }


    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }


    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }


    public void setRadius(Double radius) {
        this.radius = radius;
    }


    public void setSpeedLimit(Integer speedLimit) {
        this.speedLimit = speedLimit;
    }


    public void setActive(Boolean active) {
        this.active = active;
    }


    public void setDescription(String description) {
        this.description = description;
    }


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
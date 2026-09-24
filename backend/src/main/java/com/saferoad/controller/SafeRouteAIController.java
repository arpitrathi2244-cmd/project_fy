package com.saferoad.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.client.RestClient;


@RestController
@RequestMapping("/api/ai")
public class SafeRouteAIController {


    private final RestClient restClient;


    public SafeRouteAIController() {

        this.restClient =
                RestClient.create();

    }


    // =========================================================
    // SEND ROUTES TO PYTHON AI MODEL
    // =========================================================

    @PostMapping("/safe-route")
    public ResponseEntity<?> predictSafeRoute(
            @RequestBody Map<String, Object> request
    ) {

        try {

            Map result =
                    restClient
                            .post()
                            .uri(
                                    "http://127.0.0.1:5001/predict-safe-route"
                            )
                            .body(request)
                            .retrieve()
                            .body(Map.class);


            return ResponseEntity.ok(
                    result
            );


        } catch (Exception error) {

            return ResponseEntity
                    .internalServerError()
                    .body(
                            Map.of(
                                    "status",
                                    "error",

                                    "message",
                                    "Safe Route AI service unavailable",

                                    "details",
                                    error.getMessage()
                            )
                    );
        }
    }
}
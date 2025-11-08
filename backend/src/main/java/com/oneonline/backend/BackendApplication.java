package com.oneonline.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * ONE Online Backend - Main Application Entry Point
 *
 * This is a multiplayer card game backend with:
 * - Real-time WebSocket communication
 * - OAuth2 authentication (Google, GitHub)
 * - JWT-based session management
 * - PostgreSQL database
 * - 11 Design Patterns implementation
 *
 * @author Juan Gallardo
 * @version 1.0
 */
@SpringBootApplication
@EnableJpaAuditing
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
        System.out.println("""

                TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW
                Q   ONE ONLINE BACKEND - STARTED       Q
                Q   Port: 8080                          Q
                Q   Database: PostgreSQL                Q
                Q   Auth: JWT + OAuth2                  Q
                ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]
                """);
    }
}

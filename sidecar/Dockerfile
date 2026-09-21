# Compile with JDK (javac is not in JRE images)
FROM eclipse-temurin:11-jdk-jammy AS build

WORKDIR /build
COPY sidecar/SidecarServer.java ./
RUN javac SidecarServer.java

# Runtime: JRE only
FROM eclipse-temurin:11-jre-jammy

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget jq \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/zatca-sidecar

# Official Fatoora SDK (CSR / sign / validate used from Phase 3)
COPY sdk/ /opt/zatca-sdk/

COPY --from=build /build/SidecarServer.class ./

ENV FATOORA_HOME=/opt/zatca-sdk
ENV SIDECAR_PORT=8090
ENV SIDECAR_MAX_CONCURRENT=8

EXPOSE 8090

CMD ["java", "SidecarServer"]

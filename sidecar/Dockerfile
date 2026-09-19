FROM eclipse-temurin:11-jre-jammy

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget jq \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/zatca-sidecar

# Official Fatoora SDK (CSR / sign / validate used from Phase 3)
COPY sdk/ /opt/zatca-sdk/

COPY sidecar/SidecarServer.java ./
RUN javac SidecarServer.java

ENV FATOORA_HOME=/opt/zatca-sdk
ENV SIDECAR_PORT=8090
ENV SIDECAR_MAX_CONCURRENT=8

EXPOSE 8090

CMD ["java", "SidecarServer"]

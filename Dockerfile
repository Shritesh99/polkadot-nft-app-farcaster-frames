FROM rust:1.76-bookworm AS builder

WORKDIR /polkadot

RUN echo "Acquire::http::Pipeline-Depth 0;" > /etc/apt/apt.conf.d/99custom && \
    echo "Acquire::http::No-Cache true;" >> /etc/apt/apt.conf.d/99custom && \
    echo "Acquire::BrokenProxy    true;" >> /etc/apt/apt.conf.d/99custom && \
    echo 'Acquire::Retries "3";' >> /etc/apt/apt.conf.d/99custom && \
    echo 'Acquire::http::Timeout "240";' >> /etc/apt/apt.conf.d/99custom

# Install additional build dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    clang \
    cmake \
    librocksdb-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Add WASM target and Rust source code
RUN rustup target add wasm32-unknown-unknown && \
    rustup component add rust-src

COPY . /polkadot

# Build with vendored dependencies and WASM support
RUN cargo build --locked --release
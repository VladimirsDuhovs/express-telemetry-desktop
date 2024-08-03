use chrono::{DateTime, TimeZone, Utc};
use rust_observer_protobuf::{
    logging::{
        logging_service_server::{LoggingService, LoggingServiceServer},
        LogEntry, LogResponse,
    },
    prost_types::Timestamp,
};
use serde::Serialize;
use tauri::{AppHandle, Manager};
use tokio_stream::StreamExt;
use tonic::{transport::Server, Request, Response, Status};

const LOCAL_GRPC_SERVER_ADDRESS: &str = "[::1]:50051";

#[derive(Clone, Serialize)]
struct LogEvent {
    service_name: String,
    operation_name: String,
    level: String,
    message: String,
    timestamp: String,
}

pub struct MyLoggingService {
    app_handle: AppHandle,
}

#[tonic::async_trait]
impl LoggingService for MyLoggingService {
    async fn stream_logs(
        &self,
        request: Request<tonic::Streaming<LogEntry>>,
    ) -> Result<Response<LogResponse>, Status> {
        let mut stream = request.into_inner();

        while let Some(log_entry) = stream.next().await {
            match log_entry {
                Ok(log) => {
                    let log_level = match log.log_level {
                        1 => "INFO".to_string(),
                        2 => "WARN".to_string(),
                        3 => "ERROR".to_string(),
                        4 => "FATAL".to_string(),
                        _ => "UNKNOWN".to_string(),
                    };

                    let timestamp = if let Some(ts) = log.timestamp {
                        timestamp_to_datetime(&ts).to_rfc3339()
                    } else {
                        Utc::now().to_rfc3339()
                    };

                    let log_event = LogEvent {
                        service_name: log.service_name,
                        operation_name: log.operation_name,
                        level: log_level,
                        message: log.message,
                        timestamp,
                    };
                    self.app_handle.emit_all("new-log", log_event).unwrap();
                }
                Err(e) => eprintln!("Error receiving log: {:?}", e),
            }
        }

        Ok(Response::new(LogResponse {
            success: true,
            message: "Finished processing logs".to_string(),
        }))
    }
}

pub async fn run_grpc_server(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let addr = LOCAL_GRPC_SERVER_ADDRESS.parse()?;
    let logging_service = MyLoggingService { app_handle };

    println!("Starting gRPC server on {}", addr);

    Server::builder()
        .add_service(LoggingServiceServer::new(logging_service))
        .serve(addr)
        .await?;

    Ok(())
}

fn timestamp_to_datetime(timestamp: &Timestamp) -> DateTime<Utc> {
    Utc.timestamp_opt(timestamp.seconds, timestamp.nanos as u32)
        .single()
        .unwrap_or_else(|| Utc::now())
}

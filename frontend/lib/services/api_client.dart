import 'dart:convert';
import 'package:http/http.dart' as http;

/// Base URL for the PayCam backend. iOS Simulator shares the host's
/// network namespace, so localhost:8001 reaches the docker-compose
/// `api` service published on that port (see backend/docker-compose.yml).
/// Swap for a LAN IP if running on a physical device.
const String kApiBaseUrl = 'http://localhost:8001/api/v1';

class ApiException implements Exception {
  final int statusCode;
  final String error;
  final String message;
  final Map<String, dynamic>? body;

  ApiException({
    required this.statusCode,
    required this.error,
    required this.message,
    this.body,
  });

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({this.token});

  String? token;
  final _headersJson = {'Content-Type': 'application/json'};

  Map<String, String> _headers({bool auth = true}) {
    final h = Map<String, String>.from(_headersJson);
    if (auth && token != null) h['Authorization'] = 'Bearer $token';
    return h;
  }

  Uri _uri(String path) => Uri.parse('$kApiBaseUrl$path');

  Future<dynamic> _handle(http.Response resp) async {
    final isJson = resp.headers['content-type']?.contains('application/json') ?? false;
    final decoded = isJson && resp.body.isNotEmpty ? jsonDecode(resp.body) : null;

    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return decoded;
    }

    final map = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    throw ApiException(
      statusCode: resp.statusCode,
      error: map['error']?.toString() ?? 'unknown_error',
      message: map['message']?.toString() ??
          _firstFieldError(map) ??
          'Something went wrong. Please try again.',
      body: map,
    );
  }

  String? _firstFieldError(Map<String, dynamic> map) {
    for (final entry in map.entries) {
      if (entry.value is List && (entry.value as List).isNotEmpty) {
        return (entry.value as List).first.toString();
      }
    }
    return null;
  }

  Future<dynamic> get(String path, {bool auth = true}) async {
    final resp = await http
        .get(_uri(path), headers: _headers(auth: auth))
        .timeout(const Duration(seconds: 15));
    return _handle(resp);
  }

  Future<dynamic> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
    String? idempotencyKey,
  }) async {
    final headers = _headers(auth: auth);
    if (idempotencyKey != null) headers['Idempotency-Key'] = idempotencyKey;
    final resp = await http
        .post(_uri(path), headers: headers, body: body != null ? jsonEncode(body) : null)
        .timeout(const Duration(seconds: 15));
    return _handle(resp);
  }
}

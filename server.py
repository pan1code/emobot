from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json

from emotion_labels import EMOTIONS, THEMES


class EmoBotHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/config":
            self.send_config()
            return

        if self.path == "/":
            self.path = "/general.html"

        super().do_GET()

    def send_config(self):
        payload = {
            "emotions": EMOTIONS,
            "themes": THEMES,
        }
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run(host="127.0.0.1", port=8000):
    server = ThreadingHTTPServer((host, port), EmoBotHandler)
    print(f"emo-bot server: http://{host}:{port}/general.html")
    server.serve_forever()


if __name__ == "__main__":
    run()

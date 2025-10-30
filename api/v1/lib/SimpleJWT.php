<?php

class SimpleJWT {

    public static function encode($payload, $key, $algo = 'HS256') {
        $header = [
            'typ' => 'JWT',
            'alg' => $algo
        ];

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $key, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    public static function decode($jwt, $key, $algo = 'HS256') {
        $parts = explode('.', $jwt);

        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT format');
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        $signature = self::base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $key, true);

        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Invalid signature');
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded));

        if (isset($payload->exp) && $payload->exp < time()) {
            throw new Exception('Token expired');
        }

        return $payload;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>

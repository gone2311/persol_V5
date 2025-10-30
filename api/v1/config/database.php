<?php
class Database
{
    // TODO: Database connection info must be kept secret
    private $host = "localhost";
    private $db_name = "persol_db";
    private $username = "root";
    private $password = "";
    public $conn;

    // TODO: Use rand to generate secret key
    public static $jwt_key = "YOUR_SUPER_SECRET_KEY_123!@#";
    public static $jwt_iss = "persol.com";
    public static $jwt_aud = "persol.com";
    public static $jwt_iat = 1356999524;
    public static $jwt_exp = 1357000000;

    public function getConnection()
    {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(
                PDO::ATTR_ERRMODE,
                PDO::ERRMODE_EXCEPTION,
            );
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}

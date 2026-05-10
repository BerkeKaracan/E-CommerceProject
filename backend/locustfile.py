from locust import HttpUser, task, between

class GentleShopper(HttpUser):
    # Kullanıcılar çok hızlı tıklamasın, her tıklama arası 2 ile 5 saniye beklesin (Render'ı korumak için)
    wait_time = between(2, 5)

    @task(4)
    def browse_homepage(self):
        # Ana sayfada dolaşan sıradan kullanıcılar
        self.client.get("/api/products?page=1&limit=12&sort=Recommended")

    @task(1)
    def browse_sales(self):
        # İndirimli ürünlere bakanlar
        self.client.get("/api/products?page=1&limit=12&sort=Price:%20Low%20to%20High")
        
    # Not: Checkout'a POST atmıyoruz çünkü veritabanını sahte siparişlerle çöplüğe çevirmek istemeyiz.
    # Checkout ve stok yarışını SEN tarayıcıdan test edeceksin.
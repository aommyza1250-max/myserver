# คู่มือทดสอบ API และทำตามสไลด์ Part 4

คู่มือนี้ใช้ MongoDB Atlas เดิมของโปรเจกต์ ทดสอบเพิ่มผู้ใช้ด้วย Postman ก่อน แล้วจึงทดสอบ Docker, Docker Hub และ Azure Container Instances (ACI)

## 1. เตรียมค่า MongoDB Atlas และรัน API ในเครื่อง

1. ใน Atlas ให้มี Database User สำหรับแอป และเพิ่ม IP ของเครื่องที่ใช้ทดสอบใน **Network Access**
2. เก็บ connection string ไว้ในไฟล์ `.env` ที่ root ของโปรเจกต์ โดยใช้รูปแบบจาก `.env.example`:

   ```env
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster-url>/<database>?retryWrites=true&w=majority
   PORT=3000
   ```

   แทนค่าตัวอย่างด้วยค่าของ Atlas จริง อย่าใส่ค่า secret ใน GitHub หรือ commit ไฟล์ `.env`
3. ติดตั้งและทดสอบ:

   ```bash
   npm ci
   npm test
   npm start
   ```

   `npm test` จะ build TypeScript และรันทดสอบที่ไม่ต้องใช้ Atlas หากเชื่อมฐานข้อมูลไม่ได้ แอปจะแจ้งให้ตรวจ `MONGODB_URI` และ Atlas Network Access

## 2. ทดสอบเพิ่ม user ด้วย Postman

เมื่อเห็นข้อความว่าเชื่อม MongoDB และเซิร์ฟเวอร์ทำงานแล้ว ให้ตั้งค่า Postman ดังนี้:

- Method: `POST`
- URL: `http://localhost:3000/api/users`
- Header: `Content-Type: application/json`
- Body → raw → JSON:

  ```json
  {
    "name": "Aom Test",
    "email": "aom.test@example.com",
    "password": "change-this-password"
  }
  ```

เมื่อสำเร็จจะได้ `201 Created` และ response จะไม่มี password หรือ password hash

ตรวจสอบเพิ่มเติม:

- `GET http://localhost:3000/health` — สถานะ API และฐานข้อมูล
- `GET http://localhost:3000/api/users` — รายการผู้ใช้ โดยไม่มี password
- `GET http://localhost:3000/api/users/<id>` — ดูผู้ใช้ตาม ID
- `PUT http://localhost:3000/api/users/<id>` — แก้ข้อมูลบางส่วน โดยส่ง JSON เช่น `{ "name": "Updated Name" }`
- `DELETE http://localhost:3000/api/users/<id>` — ลบผู้ใช้
- email ซ้ำจะได้ `409 Conflict`; JSON หรือข้อมูลไม่ถูกต้องจะได้ `400 Bad Request`

API นี้ยังไม่มี authentication ดังนั้นอย่าใช้ข้อมูลจริงหรือรัน API เปิดสู่สาธารณะเป็นเวลานาน

## 3. ทดสอบ Docker Compose ในเครื่อง

ต้องติดตั้ง Docker Desktop และสร้าง `.env` ตามขั้นตอนที่ 1 ก่อน จาก root ของโปรเจกต์:

```bash
docker compose up --build -d
docker compose logs -f api
```

ทดสอบด้วย Postman ที่ `http://localhost:3000/api/users` เช่นเดิม หาก port 3000 บนเครื่องถูกใช้อยู่ ให้ตั้ง `HOST_PORT=3001` ใน `.env` แล้วใช้ `http://localhost:3001/api/users` แอปใน container ยังคงรับที่ port 3000 จากนั้นหยุด container ด้วย:

```bash
docker compose down
```

Compose นี้รันเฉพาะ API และเชื่อมต่อ Atlas; ไม่มีฐานข้อมูลแยกในเครื่อง

## 4. ตั้ง Docker Hub และ GitHub Actions

### Docker Hub

1. สร้าง repository บน Docker Hub และตั้งเป็น **Public** เพื่อให้ ACI ดึง image ได้โดยไม่ต้องตั้ง registry credentials
2. ใน Docker Hub สร้าง Access Token ที่มีสิทธิ์ Read & Write สำหรับ push image จด token ไว้ชั่วคราวเพื่อใส่ใน GitHub

### GitHub repository

เปิด **Settings → Secrets and variables → Actions** แล้วเพิ่ม:

**Repository secrets**

- `DOCKERHUB_USERNAME` — ชื่อผู้ใช้ Docker Hub
- `DOCKERHUB_TOKEN` — Access Token จาก Docker Hub (ห้ามใส่ password บัญชี)

**Repository variable**

- `DOCKERHUB_IMAGE` — ชื่อ image แบบ `ชื่อผู้ใช้/ชื่อrepository` ใช้ตัวพิมพ์เล็ก เช่น `myaccount/myserver-api`

workflow `CI` จะทำงานเมื่อ push หรือเปิด pull request และแสดงสอง jobs ต่อกัน: `test` รัน `npm ci` กับ `npm test`, จากนั้น `build` จะ build Docker image โดยไม่ต้องตั้ง Docker Hub secrets จึงใช้ตรวจงานอัตโนมัติได้ทันทีเมื่อ push workflow ขึ้น GitHub

### ส่ง image ไป Docker Hub

เลือกวิธีใดวิธีหนึ่ง:

1. **Release:** สร้าง GitHub Release โดยใช้ tag รูปแบบ `v1.0.0` แล้วกด Publish release
2. **สั่งรันเอง:** เปิดแท็บ **Actions → Publish Docker image → Run workflow**, เลือก branch แล้วกรอกเหตุผลในช่อง `reason`

ทั้งสองวิธีจะทดสอบก่อน หากผ่านจึง build และ push image ไป Docker Hub โดย Release จะสร้าง tag เวอร์ชัน และ workflow ที่สั่งเองจะสร้าง tag ตาม branch และ commit

## 5. สร้าง Azure Container Instance ตามสไลด์

ขั้นตอนนี้สร้าง resource ในบัญชี Azure ของคุณและอาจมีค่าใช้จ่ายระหว่างทำงาน โปรดลบ container group เมื่อทดสอบเสร็จ ดู [ราคา Azure Container Instances](https://azure.microsoft.com/en-us/pricing/details/container-instances/)

1. เปิด Azure Portal → **Container Instances** → **Create** แล้วเลือก Subscription, Resource Group และ Region
2. เลือก Linux และ image source จาก Docker Hub จากนั้นใส่ `DOCKERHUB_IMAGE` พร้อม tag เช่น `myaccount/myserver-api:1.0.0`
3. สำหรับ image สาธารณะไม่ต้องกรอก Docker Hub credentials; ตั้งค่า CPU 1 core, Memory 1.5 GiB ตามตัวอย่างในสไลด์
4. ตั้งค่า port เป็น `3000`/TCP และเปิด public IP; ตั้ง DNS name label หากต้องการ URL ที่จำง่าย
5. ในหน้า **Advanced → Environment variables** เพิ่ม `PORT=3000` และเพิ่ม `MONGODB_URI` โดยเลือกชนิด **Secure value** ห้ามใส่ connection string ใน Dockerfile หรือ image
6. สร้าง container group รอจนสถานะเป็น Running แล้วใช้ public IP หรือ FQDN พร้อม port `3000` ทดสอบจาก Postman:

   `POST http://<ACI-public-IP>:3000/api/users`

### อนุญาต ACI เชื่อม Atlas

Atlas อนุญาตเฉพาะ IP ที่เพิ่มใน Project **Network Access** เท่านั้น ส่วน IP สำหรับขาออกของ ACI ไม่ใช่ public IP ที่ใช้รับ request และค่าเริ่มต้นอาจเปลี่ยนได้เมื่อสร้าง resource ใหม่ [เอกสาร ACI เรื่อง outbound IP](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-egress-ip-address)

สำหรับการทดลอง ให้ตรวจ public egress IP จากภายใน container group ด้วย Azure Cloud Shell/CLI แล้วเพิ่ม IP นั้นเป็น `/32` ใน Atlas Network Access ตัวอย่างคำสั่ง:

```bash
az container exec \
  --resource-group <resource-group> \
  --name <container-group> \
  --exec-command "/bin/sh -c 'wget -qO- https://api.ipify.org'"
```

เพิ่ม IP ที่ได้เป็นรายการเดียวใน Atlas แล้วทดสอบใหม่ อย่าใช้ `0.0.0.0/0` เป็นค่าเริ่มต้น หากสร้าง ACI ใหม่หรือ restart แล้วเชื่อมไม่ได้ ให้ตรวจ egress IP และรายการ allowlist อีกครั้ง สำหรับ IP ขาออกคงที่ต้องตั้ง network เพิ่ม เช่น VNet และ Azure Firewall

## 6. ลบ Azure resource เมื่อทดสอบเสร็จ

ใน Azure Portal เปิด Container Instance แล้วกด **Delete** หรือใช้ Azure CLI:

```bash
az container delete --resource-group <resource-group> --name <container-group> --yes
```

ลบ allowlist IP ชั่วคราวออกจาก Atlas ด้วย หากสร้าง Resource Group ใหม่เพื่อทำแลปโดยเฉพาะและไม่มี resource อื่นอยู่ ให้ลบ Resource Group นั้นเพื่อล้างทรัพยากรทั้งหมด

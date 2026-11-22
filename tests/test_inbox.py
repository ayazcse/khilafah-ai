from __future__ import annotations
import uuid
def account(client,name):
 email=name.lower()+"-"+uuid.uuid4().hex[:8]+"@example.com"; password="StrongPass123"
 client.post("/api/auth/register",json={"email":email,"password":password,"full_name":name})
 token=client.post("/api/auth/login",json={"email":email,"password":password}).json()["access_token"]
 return {"Authorization":"Bearer "+token}
def test_private_inbox_request_accept_and_access_control(client):
 sender=account(client,"Sender"); recipient=account(client,"Recipient"); outsider=account(client,"Outsider")
 rid=client.get("/api/auth/me",headers=recipient).json()["id"]
 created=client.post("/api/inbox/conversations",headers=sender,json={"recipient_id":rid,"body":"Assalamu alaikum"})
 assert created.status_code==201
 cid=created.json()["id"]
 assert client.get("/api/inbox/conversations/"+cid+"/messages",headers=sender).status_code==403
 assert client.get("/api/inbox/conversations/"+cid+"/messages",headers=outsider).status_code==404
 requests=client.get("/api/inbox/conversations",headers=recipient).json()["conversations"]
 assert requests[0]["is_request"] is True
 assert client.post("/api/inbox/conversations/"+cid+"/accept",headers=recipient).status_code==200
 history=client.get("/api/inbox/conversations/"+cid+"/messages",headers=sender)
 assert history.status_code==200 and history.json()["messages"][0]["body"]=="Assalamu alaikum"
 sent=client.post("/api/inbox/conversations/"+cid+"/messages",headers=recipient,json={"body":"Wa alaikum assalam"})
 assert sent.status_code==201
 assert len(client.get("/api/inbox/conversations/"+cid+"/messages",headers=sender).json()["messages"])==2

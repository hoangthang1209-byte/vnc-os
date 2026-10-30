import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimG3Lease, heartbeatG3Lease, releaseG3Lease } from "./g3-executor-lease";
const sha="a".repeat(40);
const params={taskId:"issue-311",executorId:"codex-pilot",token:"unique-secret-lease-id",headSha:sha,nowMs:10000,ttlMs:60000};
describe("G3 executor lease guard",()=>{
  it("claims and blocks double execution",()=>{
    const a=claimG3Lease(params);assert.equal(a.ok,true);if(!a.ok)return;
    assert.deepEqual(claimG3Lease({...params,previous:a.lease}),{ok:false,reason:"active_lease"});
  });
  it("requires matching token and SHA for heartbeats",()=>{
    const a=claimG3Lease(params);if(!a.ok)throw Error("claim");
    assert.equal(heartbeatG3Lease({lease:a.lease,token:"wrong",headSha:sha,nowMs:20000,ttlMs:60000}).ok,false);
    const b=heartbeatG3Lease({lease:a.lease,token:params.token,headSha:sha,nowMs:20000,ttlMs:60000});
    assert.equal(b.ok,true);if(b.ok)assert.equal(b.lease.status,"RUNNING");
  });
  it("rejects expired heartbeats and permits new attempt",()=>{
    const a=claimG3Lease(params);if(!a.ok)throw Error("claim");
    assert.deepEqual(heartbeatG3Lease({lease:a.lease,token:params.token,headSha:sha,nowMs:70000,ttlMs:60000}),{ok:false,reason:"expired"});
    const b=claimG3Lease({...params,nowMs:70000,previous:a.lease,token:"new-secret-lease-id"});
    assert.equal(b.ok,true);if(b.ok)assert.equal(b.lease.attempt,2);
  });
  it("releases only the current claimant",()=>{
    const a=claimG3Lease(params);if(!a.ok)throw Error("claim");
    assert.equal(releaseG3Lease({lease:a.lease,token:"other",nowMs:11000}).ok,false);
    const b=releaseG3Lease({lease:a.lease,token:params.token,nowMs:11000});
    assert.equal(b.ok,true);if(b.ok)assert.equal(b.lease.status,"RELEASED");
  });
  it("requires a fresh token for a reclaimed lease",()=>{
    const a=claimG3Lease(params);if(!a.ok)throw Error("claim");
    const released=releaseG3Lease({lease:a.lease,token:params.token,nowMs:11000});
    if(!released.ok)throw Error("release");
    assert.deepEqual(claimG3Lease({...params,nowMs:12000,previous:released.lease}),{ok:false,reason:"stale_token"});
    assert.equal(claimG3Lease({...params,nowMs:12000,token:"brand-new-lease-token-123",previous:released.lease}).ok,true);
  });
  it("rejects unsafe integer expiration arithmetic",()=>{
    assert.equal(claimG3Lease({...params,nowMs:Number.MAX_SAFE_INTEGER-500,ttlMs:1000}).ok,false);
  });
  it("rejects unsafe integer heartbeat expiry arithmetic",()=>{
    const a=claimG3Lease(params);if(!a.ok)throw Error("claim");
    const nowMs=Number.MAX_SAFE_INTEGER-500;
    const lease={...a.lease,heartbeatAtMs:nowMs-1_000,expiresAtMs:nowMs+100};
    assert.deepEqual(heartbeatG3Lease({lease,token:params.token,headSha:sha,nowMs,ttlMs:1_000}),
      {ok:false,reason:"invalid"});
  });
  it("rejects malformed and unbounded leases",()=>{
    assert.equal(claimG3Lease({...params,headSha:"not-a-sha"}).ok,false);
    assert.equal(claimG3Lease({...params,ttlMs:7200000}).ok,false);
  });
});

import json, sys
from networkx.readwrite import json_graph
import networkx as nx
from pathlib import Path

data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

question = 'Why does slug() connect Docker Analysis to Planner Workflow, Repo Analysis Engine, Launch Plan Generation?'
mode = 'dfs'
terms = ['slug', 'docker', 'analysis', 'planner', 'workflow', 'repo', 'launch', 'plan']

# Find best-matching start nodes - focus on slug
scored = []
for nid, ndata in G.nodes(data=True):
    label = ndata.get('label', '').lower()
    score = sum(1 for t in terms if t in label)
    if 'slug' in label:
        score += 5  # boost slug
    if score > 0:
        scored.append((score, nid))
scored.sort(reverse=True)
start_nodes = [nid for _, nid in scored[:5]]

print(f"Start nodes: {[G.nodes[n].get('label', n) for n in start_nodes]}")
print()

# BFS from slug to see all connections
frontier = set(start_nodes)
subgraph_nodes = set(start_nodes)
subgraph_edges = []
for _ in range(3):
    next_frontier = set()
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in subgraph_nodes:
                next_frontier.add(neighbor)
                subgraph_edges.append((n, neighbor))
    subgraph_nodes.update(next_frontier)
    frontier = next_frontier

# Print full subgraph
for nid in sorted(subgraph_nodes, key=lambda n: G.degree(n), reverse=True):
    d = G.nodes[nid]
    print(f"  NODE {d.get('label', nid)} [degree={G.degree(nid)}] [src={d.get('source_file','')}] [type={d.get('file_type','')}]")

print()
print("EDGES from slug:")
slug_node = [n for n, d in G.nodes(data=True) if 'slug' in d.get('label','').lower()]
if slug_node:
    nid = slug_node[0]
    print(f"  slug node: {G.nodes[nid].get('label', nid)}")
    for neighbor in G.neighbors(nid):
        edge = G.edges[nid, neighbor]
        nlabel = G.nodes[neighbor].get('label', neighbor)
        print(f"    --> {nlabel} [{edge.get('relation','')}] ({edge.get('confidence','')}) src={G.nodes[neighbor].get('source_file','')}")
